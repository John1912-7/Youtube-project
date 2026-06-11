const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MAX_SEGMENTS = 24;
const MAX_TEXT_LENGTH = 450;

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/health") {
        return json({ ok: true, service: "youtube-project-api" });
      }

      if (url.pathname === "/api/process" && request.method === "POST") {
        const payload = await request.json();
        return json(await processVideo(payload));
      }

      return json({ error: "Not found" }, 404);
    } catch (error) {
      return json(
        {
          error: error.message || "Unknown backend error",
        },
        500
      );
    }
  },
};

async function processVideo(payload) {
  const videoId = extractYouTubeId(String(payload.url || payload.videoId || ""));
  const target = normalizeTarget(payload.target || "ru");

  if (!videoId) {
    throw new Error("Invalid YouTube URL or video ID.");
  }

  const captionTracks = await getCaptionTracks(videoId);
  const track = chooseTrack(captionTracks);

  if (!track) {
    throw new Error("No captions were found for this YouTube video.");
  }

  const sourceSegments = await fetchCaptionSegments(track.baseUrl);

  if (!sourceSegments.length) {
    throw new Error("Captions were found, but no readable text was returned.");
  }

  const limitedSegments = sourceSegments.slice(0, MAX_SEGMENTS);
  const translatedSegments = [];

  for (const segment of limitedSegments) {
    const translatedText = await translateText(segment.text, "en", target);
    translatedSegments.push({
      ...segment,
      text: translatedText,
    });
  }

  const summary = buildSummary(translatedSegments);

  return {
    videoId,
    target,
    sourceLanguage: track.languageCode || "en",
    usedSegments: translatedSegments.length,
    totalSegments: sourceSegments.length,
    summary,
    segments: translatedSegments,
  };
}

function extractYouTubeId(value) {
  const trimmed = value.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return /^[a-zA-Z0-9_-]{11}$/.test(id || "") ? id : null;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) {
        return /^[a-zA-Z0-9_-]{11}$/.test(parts[1] || "") ? parts[1] : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeTarget(target) {
  const normalized = String(target).toLowerCase();
  return normalized === "es" ? "es" : "ru";
}

async function getCaptionTracks(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(watchUrl, {
    headers: {
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube page request failed with status ${response.status}.`);
  }

  const html = await response.text();
  const marker = '"captionTracks":';
  const markerIndex = html.indexOf(marker);

  if (markerIndex === -1) {
    return [];
  }

  const tracksJson = readJsonArray(html, markerIndex + marker.length);
  return JSON.parse(tracksJson);
}

function readJsonArray(source, startIndex) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  throw new Error("Could not parse YouTube caption tracks.");
}

function chooseTrack(tracks) {
  return (
    tracks.find((track) => track.languageCode === "en" && !track.kind) ||
    tracks.find((track) => track.languageCode === "en") ||
    tracks.find((track) => String(track.languageCode || "").startsWith("en")) ||
    tracks[0]
  );
}

async function fetchCaptionSegments(baseUrl) {
  const url = new URL(baseUrl);
  url.searchParams.set("fmt", "json3");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Caption request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const events = Array.isArray(data.events) ? data.events : [];

  return events
    .map((event) => {
      const text = Array.isArray(event.segs)
        ? event.segs.map((segment) => segment.utf8 || "").join("").trim()
        : "";

      return {
        startMs: event.tStartMs || 0,
        durationMs: event.dDurationMs || 3000,
        text: cleanText(text),
      };
    })
    .filter((segment) => segment.text);
}

function cleanText(text) {
  return text.replace(/\s+/g, " ").replace(/\n/g, " ").trim();
}

async function translateText(text, source, target) {
  const limitedText = text.slice(0, MAX_TEXT_LENGTH);
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", limitedText);
  url.searchParams.set("langpair", `${source}|${target}`);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Youtube-project MVP",
    },
  });

  if (!response.ok) {
    return limitedText;
  }

  const data = await response.json();
  return data?.responseData?.translatedText || limitedText;
}

function buildSummary(segments) {
  const text = segments
    .slice(0, 8)
    .map((segment) => segment.text)
    .join(" ");

  if (text.length <= 280) {
    return text;
  }

  return `${text.slice(0, 277).trim()}...`;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

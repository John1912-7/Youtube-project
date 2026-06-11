const form = document.querySelector("#translate-form");
const urlInput = document.querySelector("#youtube-url");
const statusEl = document.querySelector("#status");
const iframe = document.querySelector("#video-preview");
const videoIdLabel = document.querySelector("#video-id-label");
const languageLabel = document.querySelector("#language-label");
const summaryText = document.querySelector("#summary-text");
const subtitleList = document.querySelector("#subtitle-list");
const downloadSrt = document.querySelector("#download-srt");
const downloadVtt = document.querySelector("#download-vtt");

const apiFromUrl = new URLSearchParams(window.location.search).get("api");
if (apiFromUrl) {
  localStorage.setItem("youtubeProjectApiUrl", apiFromUrl.replace(/\/$/, ""));
}

const API_BASE_URL = (
  apiFromUrl ||
  localStorage.getItem("youtubeProjectApiUrl") ||
  "https://youtube-project-api.john20040703.workers.dev"
).replace(/\/$/, "");

const copy = {
  ru: {
    label: "RU",
    summary:
      "Короткое summary будет собрано из доступных YouTube captions. В MVP мы сохраняем главную мысль видео и готовим текст для быстрого просмотра creator-командой.",
    subtitles: [
      ["00:00:01", "Переведенная строка субтитров появится здесь."],
      ["00:00:05", "Каждый сегмент сохраняет тайминг для экспорта SRT и VTT."],
      ["00:00:09", "Первая версия работает с доступными YouTube captions."]
    ]
  },
  es: {
    label: "ES",
    summary:
      "El resumen se creara a partir de los captions disponibles de YouTube. El MVP guarda la idea principal del video y prepara el texto para revisar rapido.",
    subtitles: [
      ["00:00:01", "La linea traducida de subtitulos aparecera aqui."],
      ["00:00:05", "Cada segmento mantiene el tiempo para exportar SRT y VTT."],
      ["00:00:09", "La primera version usa captions disponibles de YouTube."]
    ]
  }
};

let currentVideoId = "jNQXAC9IVRw";
let currentLanguage = "ru";
let currentSegments = copy.ru.subtitles.map(([time, text]) => ({
  time,
  text,
  startMs: parseDisplayTime(time),
  durationMs: 3000
}));

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
      const marker = ["embed", "shorts", "live"].find((part) => parts[0] === part);
      if (marker && /^[a-zA-Z0-9_-]{11}$/.test(parts[1] || "")) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

function setStatus(message, state = "") {
  statusEl.textContent = message;
  statusEl.className = state ? `status is-${state}` : "status";
}

function renderOutput() {
  const selected = document.querySelector('input[name="language"]:checked');
  currentLanguage = selected ? selected.value : "ru";
  const activeCopy = copy[currentLanguage];

  languageLabel.textContent = activeCopy.label;
  summaryText.textContent = activeCopy.summary;
  currentSegments = activeCopy.subtitles.map(([time, text]) => ({
    time,
    text,
    startMs: parseDisplayTime(time),
    durationMs: 3000
  }));
  renderSegments(currentSegments);
}

function updateVideo(videoId) {
  currentVideoId = videoId;
  iframe.src = `https://www.youtube.com/embed/${videoId}`;
  videoIdLabel.textContent = `Video ID: ${videoId}`;
}

function buildSrt() {
  return currentSegments
    .map((segment, index) => {
      const start = formatSrtTime(segment.startMs);
      const end = formatSrtTime(segment.startMs + (segment.durationMs || 3000));
      return `${index + 1}\n${start} --> ${end}\n${segment.text}`;
    })
    .join("\n\n");
}

function buildVtt() {
  const body = buildSrt()
    .replaceAll(",", ".")
    .replaceAll(/^\d+\n/gm, "");
  return `WEBVTT\n\n${body}`;
}

function downloadFile(name, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const videoId = extractYouTubeId(urlInput.value);

  if (!videoId) {
    setStatus("Paste a valid YouTube video link.", "error");
    return;
  }

  updateVideo(videoId);
  processVideo();
});

document.querySelectorAll('input[name="language"]').forEach((input) => {
  input.addEventListener("change", () => {
    renderOutput();
    setStatus("Language updated.", "success");
  });
});

downloadSrt.addEventListener("click", () => {
  downloadFile(`${currentVideoId}-${currentLanguage}.srt`, buildSrt());
});

downloadVtt.addEventListener("click", () => {
  downloadFile(`${currentVideoId}-${currentLanguage}.vtt`, buildVtt());
});

renderOutput();

async function processVideo() {
  if (!API_BASE_URL) {
    renderOutput();
    setStatus(
      "Backend API is not connected yet. Deploy the Cloudflare Worker, then open this site with ?api=YOUR_WORKER_URL.",
      "error"
    );
    return;
  }

  setStatus("Getting captions and translating...", "");

  try {
    const response = await fetch(`${API_BASE_URL}/api/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: urlInput.value,
        target: currentLanguage
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Translation failed.");
    }

    currentSegments = data.segments.map((segment) => ({
      ...segment,
      time: formatDisplayTime(segment.startMs)
    }));

    languageLabel.textContent = currentLanguage.toUpperCase();
    summaryText.textContent = data.summary;
    renderSegments(currentSegments);
    setStatus(
      `Translated ${data.usedSegments} of ${data.totalSegments} caption segments.`,
      "success"
    );
  } catch (error) {
    renderOutput();
    setStatus(error.message || "Could not translate this video.", "error");
  }
}

function renderSegments(segments) {
  subtitleList.innerHTML = segments
    .map(
      ({ time, text }) => `
        <li>
          <time>${time}</time>
          <span>${text}</span>
        </li>
      `
    )
    .join("");
}

function parseDisplayTime(time) {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

function formatDisplayTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatSrtTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const ms = String(milliseconds % 1000).padStart(3, "0");
  return `${hours}:${minutes}:${seconds},${ms}`;
}

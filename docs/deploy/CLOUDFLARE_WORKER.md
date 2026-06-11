# Cloudflare Worker backend

GitHub Pages не умеет запускать backend. Поэтому для реального перевода по YouTube-ссылке нужен отдельный бесплатный backend.

Стартовый вариант: Cloudflare Worker.

## Что делает Worker

- принимает `POST /api/process`;
- получает YouTube URL или video ID;
- открывает YouTube watch page на server-side;
- достает `captionTracks`;
- выбирает английские captions;
- скачивает captions в `json3`;
- переводит первые segments через MyMemory;
- возвращает `summary` и translated subtitle segments.

## Почему Cloudflare Worker

- есть бесплатный план;
- не нужен отдельный сервер;
- можно быстро получить публичный API URL;
- Worker может делать server-side `fetch`, поэтому он обходит browser CORS.

## Как задеплоить вручную

1. Открыть Cloudflare Dashboard.
2. Перейти в `Workers & Pages`.
3. Создать новый Worker.
4. Назвать его `youtube-project-api`.
5. Вставить код из `backend/cloudflare-worker/worker.js`.
6. Нажать `Deploy`.
7. Проверить:

```text
https://youtube-project-api.<your-subdomain>.workers.dev/health
```

Ожидаемый ответ:

```json
{"ok":true,"service":"youtube-project-api"}
```

## Как подключить сайт

После деплоя Worker можно быстро подключить его без изменения кода. Открыть сайт так:

```text
https://john1912-7.github.io/Youtube-project/?api=https://youtube-project-api.<your-subdomain>.workers.dev
```

Frontend сохранит URL в `localStorage` и будет использовать его для следующих запросов.

Когда Worker URL станет постоянным, лучше hardcode-нуть его в `app.js`, обновить `main` и заново опубликовать `gh-pages`.

## Ограничения MVP

- Работают только видео, где YouTube отдает captions.
- Перевод через MyMemory бесплатный, но качество и лимиты не гарантируются.
- Для экономии Worker переводит первые `24` subtitle segments.
- Это временный backend для MVP, не финальная production-архитектура.

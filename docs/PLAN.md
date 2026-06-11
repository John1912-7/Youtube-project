# 20-дневный план запуска

Цель: за 20 дней сделать MVP сервиса **Translate Every Video on YouTube** и проверить, готовы ли creators платить за перевод YouTube-видео, subtitles и summary.

## Принципы

- Сначала проверяем деньги, потом улучшаем качество.
- Не скачиваем и не рендерим видео в первой версии.
- Используем captions-first подход.
- Держим расходы почти на нуле.
- Все дорогие операции должны иметь limits.
- Любой внешний provider должен быть заменяемым.

## День 1-3: foundation

Задачи:

- Создать private GitHub repo.
- Добавить README и docs.
- Зафиксировать MVP scope.
- Создать `.env.example` и `.gitignore`.
- Подготовить структуру Next.js app.
- Определить базовые routes.

Готово, когда:

- repo понятен новому разработчику;
- есть план, сервисы и SEO checklist;
- можно начинать scaffold приложения без дополнительных решений.

## День 4-7: core flow

Задачи:

- Реализовать YouTube URL parser.
- Валидировать video ID.
- Создать форму вставки ссылки.
- Создать result page.
- Встроить YouTube preview.
- Подключить transcript/captions fetching.
- Добавить состояния loading/error/success.

Готово, когда:

- пользователь может вставить YouTube URL;
- система показывает video preview;
- transcript отображается, если captions доступны.

## День 8-10: translation и output

Задачи:

- Подключить self-hosted LibreTranslate или Argos provider.
- Сделать provider interface для перевода.
- Переводить transcript segments.
- Генерировать `.srt`.
- Генерировать `.vtt`.
- Сгенерировать простое summary.

Готово, когда:

- пользователь получает translated subtitles;
- пользователь может скачать `.srt` и `.vtt`;
- summary отображается на странице результата.

## День 11-13: limits и monetization

Задачи:

- Добавить free usage limits.
- Сохранять jobs и outputs.
- Подготовить pricing page.
- Добавить простой paid intent: credits/pay-per-video.
- Подготовить Stripe integration как optional step.

Готово, когда:

- free usage не может бесконечно нагружать сервер;
- есть понятный paid offer;
- можно вручную принять оплату или быстро подключить Stripe.

## День 14-16: polish и SEO

Задачи:

- Улучшить mobile UX.
- Добавить metadata, sitemap, robots.
- Добавить SEO landing copy.
- Подготовить страницы под 2-3 поисковых запроса.
- Добавить базовую analytics.
- Проверить ошибки на реальных YouTube URLs.

Готово, когда:

- сайт выглядит достаточно доверительно;
- основные страницы индексируемы;
- пользовательский flow не ломается на мобильном.

## День 17-20: launch и первые продажи

Задачи:

- Найти 30-50 creators вручную.
- Сделать 5-10 бесплатных demo-результатов.
- Попросить feedback и оплату за следующие видео.
- Записать короткие before/after demos.
- Исправить bugs, которые мешают оплате.
- Обновить pricing по реакции пользователей.

Готово, когда:

- есть первые реальные пользователи или отказы с причинами;
- есть минимум одна попытка получить оплату;
- понятны следующие feature priorities.

## Критерии успеха MVP

- Пользователь может обработать YouTube-ссылку без помощи разработчика.
- Для видео с captions результат появляется стабильно.
- `.srt` и `.vtt` скачиваются и открываются.
- Summary достаточно полезно, чтобы понять содержание видео.
- Есть понятный free limit и paid offer.
- Можно показать продукт creator за 2 минуты.

## Что переносим после MVP

- Audio transcription для видео без captions.
- Burned-in subtitles в mp4.
- Voice dubbing.
- Team accounts.
- Public API.
- Browser extension.
- Поддержка TikTok, Vimeo, Instagram, direct upload.

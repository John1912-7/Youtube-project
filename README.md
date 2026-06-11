# Youtube-project

**Translate Every Video on YouTube**

`Youtube-project` - это будущий SaaS-сервис для creators: пользователь вставляет ссылку на YouTube-видео и получает video preview, переведенные субтитры и краткое summary.

README написан как рабочий документ для разработки. Его цель - быстро объяснить, что мы строим, зачем, какая первая версия нужна, какие папки будут в проекте и какие решения уже выбраны.

## Главная цель

Запустить MVP за 20 дней и проверить, готовы ли creators платить за быстрый перевод YouTube-контента.

Главный принцип первой версии: **почти нулевые расходы**. Мы не строим дорогую AI-платформу сразу. Сначала делаем минимальный полезный продукт на free hosting, free/self-hosted tools и простом workflow.

## Для кого продукт

Основная аудитория первой версии:

- YouTube creators, которые хотят переводить видео на другую аудиторию.
- TikTok/Reels/Shorts creators, которые переиспользуют длинный YouTube-контент.
- Авторы курсов и обучающих видео.
- Малые команды, которым нужны subtitles и summary без ручной работы.

## MVP

Первая версия должна уметь:

1. Принимать YouTube URL.
2. Проверять, что ссылка валидная и поддерживаемая.
3. Встраивать оригинальное YouTube-видео на странице результата.
4. Получать доступные captions/transcript, если они есть у видео.
5. Переводить субтитры на выбранный язык.
6. Генерировать краткое summary видео.
7. Показывать subtitles и summary в интерфейсе.
8. Давать скачать результат в `.srt` и `.vtt`.

Что **не входит** в первую версию:

- Скачивание видео с YouTube.
- Генерация нового mp4-файла.
- Вшивание субтитров в видео.
- AI voice dubbing.
- Поддержка любых сайтов кроме YouTube.
- Идеальное качество перевода.

## Почему captions-first

На старте мы используем подход **captions-first**:

- сначала пытаемся взять существующие YouTube captions/transcript;
- если captions нет, показываем понятную ошибку или fallback;
- не скачиваем аудио и не транскрибируем его в первой версии.

Так мы уменьшаем стоимость, сложность и юридические риски. Позже можно добавить audio transcription как paid feature.

## Техническое решение

Стартовая архитектура: **один простой Next.js app**, без monorepo.

Базовый стек:

- Next.js
- TypeScript
- Tailwind CSS
- Node.js server-side logic внутри Next.js
- SQLite или Postgres на Oracle Cloud для старта
- Docker для деплоя на Oracle Always Free
- Self-hosted LibreTranslate или Argos Translate для максимально бесплатного перевода

Почему не monorepo:

- MVP нужно запустить быстро.
- Один app проще деплоить, тестировать и менять.
- Когда появятся реальные пользователи, можно выделить worker/backend отдельно.

## Планируемая структура проекта

```text
.
├── README.md
├── .env.example
├── .gitignore
├── docs/
│   ├── PLAN.md
│   ├── SERVICES.md
│   └── SEO_PROMOTION.md
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── server/
│   ├── providers/
│   └── db/
├── public/
├── package.json
├── next.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

### `src/app`

Страницы и routes Next.js App Router.

Планируемые страницы:

- `/` - landing page.
- `/app` - dashboard пользователя.
- `/app/new` - форма для новой YouTube-ссылки.
- `/app/jobs/[id]` - страница результата обработки видео.
- `/pricing` - pricing и limits.

### `src/components`

UI-компоненты:

- форма вставки YouTube URL;
- выбор языка перевода;
- video preview;
- transcript/subtitles viewer;
- блок summary;
- кнопки download `.srt` и `.vtt`;
- pricing cards;
- loading/error states.

### `src/lib`

Общие helper-функции:

- парсинг YouTube URL;
- валидация video ID;
- форматирование времени;
- генерация `.srt`;
- генерация `.vtt`;
- chunking длинного текста;
- rate limit helpers.

### `src/server`

Server-side логика:

- создание job;
- получение transcript;
- запуск перевода;
- генерация summary;
- сохранение результата;
- проверка free/paid limits.

### `src/providers`

Адаптеры к сервисам и инструментам:

- YouTube transcript provider;
- LibreTranslate/Argos provider;
- optional DeepL provider;
- optional Azure Translator provider;
- optional Stripe provider.

Главное правило: бизнес-логика не должна быть жестко привязана к одному API. Если бесплатный перевод окажется плохим или нестабильным, мы должны быстро заменить provider.

### `src/db`

Работа с базой данных:

- database client;
- schema/types;
- queries для jobs;
- queries для users;
- usage events.

### `docs`

Документы проекта:

- [`docs/PLAN.md`](docs/PLAN.md) - 20-дневный план запуска.
- [`docs/SERVICES.md`](docs/SERVICES.md) - бесплатные/дешевые сервисы и риски.
- [`docs/SEO_PROMOTION.md`](docs/SEO_PROMOTION.md) - SEO и promotion без бюджета.

## Основной пользовательский сценарий

1. Пользователь открывает сайт.
2. Вставляет YouTube URL.
3. Выбирает язык перевода.
4. Нажимает кнопку обработки.
5. Система создает job.
6. Система ищет captions/transcript.
7. Если transcript найден, система переводит segments.
8. Система генерирует summary.
9. Пользователь видит:
   - YouTube video preview;
   - summary;
   - translated subtitles;
   - download buttons.
10. Если пользователь уперся в free limit, показываем paid option.

## Сервисы

На старте используем максимально бесплатный набор:

- GitHub private repo - хранение кода и документации.
- Oracle Always Free - основной вариант hosting/server.
- LibreTranslate или Argos Translate - self-hosted перевод.
- SQLite или Postgres - база данных на том же сервере.
- GitHub Actions - позже для CI, если это не усложнит запуск.

Optional later:

- DeepL Free - более качественный перевод с бесплатным лимитом.
- Azure Translator Free - альтернативный translation provider.
- Stripe - платежи.
- Supabase - auth/database, если решим не держать все на Oracle.
- PostHog - product analytics.

Подробности: [`docs/SERVICES.md`](docs/SERVICES.md).

## Монетизация

Цель первых 20 дней - получить первые деньги, а не построить идеальную модель.

План монетизации:

- free limited usage для первого demo;
- pay-per-video или credits для быстрых оплат;
- subscription позже, когда появятся повторные пользователи;
- ads не считаем главным источником денег в первые 20 дней.

Почему не ads сразу:

- реклама требует трафик;
- в первые недели трафика почти нет;
- creators быстрее платят за конкретный результат, чем сайт зарабатывает на рекламе.

## Roadmap на 20 дней

Короткая версия:

- Дни 1-3: документация, repo, базовая структура, landing skeleton.
- Дни 4-7: YouTube URL parsing, transcript fetching, result page.
- Дни 8-10: translation provider, SRT/VTT generation, summary.
- Дни 11-13: free limits, pricing, basic monetization flow.
- Дни 14-16: UI polish, mobile, SEO pages, analytics.
- Дни 17-20: ручной promotion, demos для creators, исправление blocking bugs.

Полная версия: [`docs/PLAN.md`](docs/PLAN.md).

## SEO и бесплатное продвижение

Бесплатное SEO на старте:

- страницы под запросы `youtube subtitle translator`, `translate youtube subtitles`, `youtube video summary`;
- sitemap и robots;
- OpenGraph metadata;
- FAQ blocks;
- полезные free tools позже: `SRT to VTT`, `VTT to SRT`, `Subtitle Translator`.

Бесплатное продвижение:

- писать creators вручную;
- делать 1 demo-перевод бесплатно;
- публиковать короткие before/after demos;
- искать пользователей в Reddit, Discord, Telegram, YouTube comments без спама.

Подробности: [`docs/SEO_PROMOTION.md`](docs/SEO_PROMOTION.md).

## Как запустить локально

Этот раздел будет обновлен после создания Next.js app.

Планируемый workflow:

```bash
npm install
cp .env.example .env
npm run dev
```

Планируемые проверки:

```bash
npm run lint
npm run typecheck
npm run build
```

## Переменные окружения

Список будет храниться в `.env.example`.

Ожидаемые группы:

- app URL;
- database URL;
- translation provider config;
- auth/session config;
- payment provider config;
- analytics config.

## Важные ограничения первой версии

- Качество перевода может быть средним или плохим, если используем полностью бесплатный self-hosted перевод.
- Не все YouTube-видео имеют доступные captions.
- Первая версия не обрабатывает private/unavailable videos.
- Первая версия не обещает идеальный тайминг subtitles.
- Первая версия не генерирует новый video file.

## Текущий статус

Проект находится на этапе foundation:

- private GitHub repo создан;
- README и docs подготавливаются;
- код приложения еще не создан;
- следующий шаг - scaffold Next.js app и первая рабочая страница.

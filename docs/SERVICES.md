# Сервисы и бесплатные варианты

Этот документ фиксирует сервисы, которые можно использовать для MVP с минимальными расходами.

## Главный принцип

На старте выбираем решения, которые:

- можно использовать бесплатно или почти бесплатно;
- не блокируют MVP;
- можно заменить позже;
- не требуют сложной инфраструктуры.

## GitHub

Использование:

- private repo;
- commits;
- issues/tasks позже;
- GitHub Actions позже, если понадобится CI.

Статус:

- repo: `John1912-7/Youtube-project`;
- visibility: private.

## Hosting: Oracle Always Free

Oracle Always Free - основной кандидат для zero-cost hosting.

План:

- поднять VM;
- установить Docker;
- запускать Next.js app;
- запускать translation service рядом или отдельным контейнером;
- хранить SQLite/Postgres на сервере.

Плюсы:

- можно получить полноценный server;
- подходит для self-hosted translation;
- не привязан к serverless limits;
- хорошо для MVP без ежемесячной оплаты.

Минусы:

- нужно самому настраивать server;
- нужно следить за uptime;
- деплой сложнее, чем Vercel;
- availability Always Free ресурсов зависит от региона.

## Hosting fallback: Vercel

Vercel подходит для быстрого Next.js deploy.

Плюсы:

- очень быстро запускать Next.js;
- простой preview deploy;
- меньше DevOps.

Минусы:

- self-hosted translation рядом не запустить;
- serverless limits;
- при росте может потребоваться paid plan.

Решение:

- основной план - Oracle;
- Vercel можно использовать later для frontend-only или preview.

## GitHub Pages

GitHub Pages не подходит как основной hosting для SaaS.

Можно использовать:

- только для простой public landing;
- только если backend находится отдельно.

Не используем для MVP app, потому что:

- нет backend;
- нет нормальной обработки jobs;
- нет server-side translation;
- не лучший вариант для коммерческого SaaS.

## Translation: LibreTranslate

LibreTranslate - open-source translation API.

Использование:

- self-host на Oracle;
- HTTP API внутри приложения;
- provider adapter в `src/providers`.

Плюсы:

- нет оплаты за символы;
- можно запускать локально;
- простой API.

Минусы:

- качество хуже DeepL;
- может быть медленно;
- нужны ресурсы сервера;
- некоторые языковые пары могут работать хуже.

## Translation: Argos Translate

Argos Translate - offline/open-source переводчик.

Использование:

- как backend для LibreTranslate или отдельный worker;
- подходит для максимально бесплатного MVP.

Плюсы:

- offline;
- no API cost;
- можно контролировать модели.

Минусы:

- качество среднее;
- нужно скачивать языковые модели;
- может быть тяжелее в настройке.

## Translation fallback: MyMemory

MyMemory можно рассматривать как fallback для тестов.

Плюсы:

- публичный API;
- не требует сложного self-host setup.

Минусы:

- ограничения на длину сегментов;
- качество и стабильность не гарантированы;
- не стоит строить основной продукт только на нем.

## Optional later: DeepL Free

DeepL Free можно добавить позже, если нужен качественный перевод для первых платящих пользователей.

Плюсы:

- качество сильно лучше open-source вариантов;
- понятный API;
- хорошо для demo.

Минусы:

- бесплатный лимит ограничен;
- нужен API key;
- при росте появится cost.

## Optional later: Azure Translator

Azure Translator можно добавить как альтернативный provider.

Плюсы:

- хороший лимит на free tier;
- много языков;
- enterprise-grade сервис.

Минусы:

- сложнее настройка аккаунта;
- billing может быть неудобен;
- нужно дополнительно проверить актуальные условия.

## Database

Вариант 1: SQLite.

Плюсы:

- проще всего для MVP;
- можно держать на Oracle VM;
- не нужен отдельный сервис.

Минусы:

- хуже для масштабирования;
- backup нужно настроить отдельно.

Вариант 2: Postgres на Oracle.

Плюсы:

- лучше для будущего SaaS;
- привычная структура данных.

Минусы:

- больше настройки;
- требует аккуратного backup.

Стартовое решение:

- SQLite для самого быстрого MVP;
- Postgres позже, если появятся пользователи.

## Payments

Старт:

- можно начать с ручной оплаты или payment link;
- Stripe подключить, когда pricing станет понятнее.

Later:

- Stripe Checkout;
- credits;
- subscription.

## Analytics

Минимум:

- server logs;
- простая таблица usage events.

Later:

- PostHog;
- Google Analytics;
- Plausible.

## Provider strategy

Все внешние сервисы подключаются через adapter pattern:

- `translate(text, options)`;
- `getTranscript(videoId)`;
- `createCheckoutSession(plan)`;
- `trackEvent(event)`.

Так мы сможем заменить бесплатный provider на платный без переписывания всего приложения.

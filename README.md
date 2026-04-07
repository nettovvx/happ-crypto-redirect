# happ-crypto-redirect

Production-ready backend-сервис на Node.js/Express для безопасного редиректа старых subscription-ссылок через Happ Crypto API.

Сервис принимает старые URL, извлекает token, внутри backend формирует новый subscription URL на домене `happ-crypto.nettovvx.me`, шифрует его через Happ Crypto API и отдает пользователю только encrypted redirect.

Открытые subscription URL наружу не выдаются.

## Что обрабатывается

1. Старая subscription ссылка:

`https://link.nettovvx.me/api/sub/<TOKEN>`

2. Старая miniapp redirect ссылка:

`https://lk-link.nettovvx.me/miniapp/redirect.html?url=happ%3A%2F%2Fadd%2Fhttps%3A%2F%2Flink.nettovvx.me%2Fapi%2Fsub%2F<TOKEN>&lang=ru`

После decode ожидается:

`happ://add/https://link.nettovvx.me/api/sub/<TOKEN>`

## Endpoints

1. `GET /health` -> `{"ok":true}`
2. `GET /api/sub/:token`
3. `GET /miniapp/redirect.html?url=...&lang=ru`
4. `GET /debug` (опционально, только при `ALLOW_DEBUG_ENDPOINTS=true`)

## Режимы miniapp результата

Управляется переменной `MINIAPP_RESULT_MODE`:

- `direct` -> 307 redirect на encrypted URL
- `happ_add` -> 307 redirect на `happ://add/<encrypted URL>`
- `html_bridge` -> HTML-страница с JS redirect на `happ://add/<encrypted URL>`

## Запуск локально

```bash
cp .env.example .env
npm install
npm start
```

Проверка:

```bash
curl -i http://localhost:3000/health
curl -i http://localhost:3000/api/sub/CNrFDXcGYqfp_HwG
curl -i "http://localhost:3000/miniapp/redirect.html?url=happ%3A%2F%2Fadd%2Fhttps%3A%2F%2Flink.nettovvx.me%2Fapi%2Fsub%2FCNrFDXcGYqfp_HwG&lang=ru"
```

## Docker

```bash
cp .env.example .env
docker compose up --build -d
```

Сервис рассчитан на работу за внешним reverse proxy (например, существующим Caddy).

## Переменные окружения

См. `.env.example`:

- `NODE_ENV`
- `PORT`
- `HAPP_CRYPTO_API`
- `NEW_SUB_BASE_URL`
- `REQUEST_TIMEOUT_MS`
- `LOG_LEVEL`
- `MINIAPP_RESULT_MODE`
- `ALLOW_DEBUG_ENDPOINTS`
- `TRUST_PROXY`

## Безопасность

- открытые subscription URL не возвращаются пользователю
- полные чувствительные URL не логируются
- логируются только технические метаданные (`requestId`, статус, latency, masked token)
- `x-powered-by` отключен

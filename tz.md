Нужно создать production-ready backend-сервис в Docker для шифрования subscription URL через Happ Crypto API и редиректа пользователей со старых ссылок, без отдачи открытых subscription URL наружу.

Поддерживаемые входящие сценарии:

1) Старая ссылка подписки:
https://link.nettovvx.me/api/sub/<TOKEN>

Пример:
https://link.nettovvx.me/api/sub/CNrFDXcGYqfp_HwG

2) Старая miniapp redirect-ссылка:
https://lk-link.nettovvx.me/miniapp/redirect.html?url=happ%3A%2F%2Fadd%2Fhttps%3A%2F%2Flink.nettovvx.me%2Fapi%2Fsub%2FCNrFDXcGYqfp_HwG&lang=ru

После URL decode формат такой:
happ://add/https://link.nettovvx.me/api/sub/<TOKEN>

Новый реальный subscription URL, который должен использоваться только внутри backend:
https://happ-crypto.nettovvx.me/api/sub/<TOKEN>

Что должен делать сервис:
- принимать старые ссылки
- извлекать token
- внутри backend собирать новый URL подписки на домене happ-crypto.nettovvx.me
- отправлять этот URL в Happ Crypto API:
  POST https://crypto.happ.su/api-v2.php
  Content-Type: application/json
  Body: {"url":"https://happ-crypto.nettovvx.me/api/sub/<TOKEN>"}
- получать encrypted URL
- отдавать пользователю только redirect/result на encrypted URL
- никогда не отдавать пользователю открытые старые или новые subscription URL

Критично:
- нельзя redirect на https://happ-crypto.nettovvx.me/api/sub/<TOKEN>
- нельзя показывать https://happ-crypto.nettovvx.me/api/sub/<TOKEN> в JSON, HTML, JS
- нельзя логировать полные чувствительные URL
- можно логировать только маскированный token, request id, статус, latency

Технологии:
- Node.js 20
- Express
- Docker
- docker-compose
- Caddy в проект не включать, он уже существует отдельно
- backend должен быть рассчитан на работу за внешним reverse proxy

Нужные endpoints:
1) GET /health -> {"ok":true}
2) GET /api/sub/:token
   - валидировать token
   - собрать внутренний URL https://happ-crypto.nettovvx.me/api/sub/:token
   - зашифровать через Happ API
   - вернуть redirect только на encrypted URL
3) GET /miniapp/redirect.html?url=...&lang=ru
   - decode query param url
   - разобрать формат happ://add/https://link.nettovvx.me/api/sub/:token
   - извлечь token
   - собрать внутренний URL https://happ-crypto.nettovvx.me/api/sub/:token
   - зашифровать через Happ API
   - вернуть redirect/result только на encrypted URL
   - режим miniapp результата должен задаваться переменной окружения:
     - direct
     - happ_add
     - html_bridge
4) debug endpoint опционально, только через флаг окружения, без утечки открытых URL

Требования к коду:
- модульная структура
- отдельный клиент для Happ API
- отдельный парсер miniapp URL
- отдельная валидация token
- middleware для request id, request logging, error handling, security headers
- timeout на запрос во внешний API
- обработка invalid response от Happ API
- безопасные ответы об ошибках без утечки внутренних URL
- x-powered-by выключить
- trust proxy учитывать через env

Требования к конфигурации:
.env должен включать:
NODE_ENV=production
PORT=3000
HAPP_CRYPTO_API=https://crypto.happ.su/api-v2.php
NEW_SUB_BASE_URL=https://happ-crypto.nettovvx.me/api/sub/
REQUEST_TIMEOUT_MS=10000
LOG_LEVEL=info
MINIAPP_RESULT_MODE=happ_add
ALLOW_DEBUG_ENDPOINTS=false
TRUST_PROXY=true

Структура проекта ожидается примерно такая:
- Dockerfile
- docker-compose.yml
- .env.example
- README.md
- src/server.js
- src/app.js
- src/config.js
- src/routes/health.js
- src/routes/sub.js
- src/routes/miniapp.js
- src/services/happCryptoClient.js
- src/services/redirectService.js
- src/utils/token.js
- src/utils/miniappParser.js
- src/utils/mask.js
- src/utils/requestId.js
- src/middleware/errorHandler.js
- src/middleware/requestLogger.js
- src/middleware/securityHeaders.js
- src/logger.js

Требования к ответам:
- success sub: HTTP 302/307 -> Location: encrypted URL
- success miniapp: в зависимости от MINIAPP_RESULT_MODE, но только с encrypted URL
- invalid token: 400 {"ok":false,"error":"invalid_token"}
- invalid miniapp url: 400 {"ok":false,"error":"invalid_miniapp_url"}
- encryption failure: 502 {"ok":false,"error":"encryption_failed"}
- internal error: 500 {"ok":false,"error":"internal_error"}

Требования к Docker:
- production Dockerfile на node:20-alpine
- запуск через docker compose up --build -d
- Caddy не добавлять
- сервис должен быть готов для проксирования снаружи существующим Caddy

README должен содержать:
- назначение сервиса
- примеры обрабатываемых URL
- запуск
- примеры проверки
- описание env-переменных
- примечание, что сервис работает за внешним Caddy
- примечание, что открытые subscription URL наружу не выдаются
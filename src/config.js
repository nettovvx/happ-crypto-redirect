const { URL } = require('node:url');

require('dotenv').config({ quiet: true });

const RESULT_MODES = new Set(['direct', 'happ_add', 'html_bridge']);

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function parseInteger(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

function ensureValidUrl(value, name) {
  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`Invalid URL in ${name}`);
  }
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function parseTrustProxy(value) {
  if (value === undefined || value === null || value === '') return false;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;

  const parsedNumber = Number.parseInt(normalized, 10);
  if (!Number.isNaN(parsedNumber)) return parsedNumber;

  return value;
}

const nodeEnv = process.env.NODE_ENV || 'production';
const port = parseInteger(process.env.PORT, 3000);
const requestTimeoutMs = parseInteger(process.env.REQUEST_TIMEOUT_MS, 10000);
const logLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const miniappResultMode = process.env.MINIAPP_RESULT_MODE || 'happ_add';
const allowDebugEndpoints = parseBoolean(process.env.ALLOW_DEBUG_ENDPOINTS, false);
const trustProxy = parseTrustProxy(process.env.TRUST_PROXY);

if (!RESULT_MODES.has(miniappResultMode)) {
  throw new Error('MINIAPP_RESULT_MODE must be one of: direct, happ_add, html_bridge');
}

if (!Number.isInteger(port) || port <= 0) {
  throw new Error('PORT must be a positive integer');
}

if (!Number.isInteger(requestTimeoutMs) || requestTimeoutMs <= 0) {
  throw new Error('REQUEST_TIMEOUT_MS must be a positive integer');
}

const happCryptoApi = ensureValidUrl(
  process.env.HAPP_CRYPTO_API || 'https://crypto.happ.su/api-v2.php',
  'HAPP_CRYPTO_API'
);

const happCryptoFallbackApi = ensureValidUrl(
  process.env.HAPP_CRYPTO_FALLBACK_API || 'https://crypto.happ.su/api.php',
  'HAPP_CRYPTO_FALLBACK_API'
);

const preferLegacyDeeplink = parseBoolean(process.env.PREFER_LEGACY_DEEPLINK, true);

const newSubBaseUrl = ensureTrailingSlash(
  ensureValidUrl(
    process.env.NEW_SUB_BASE_URL || 'https://happ-crypto.nettovvx.me/api/sub/',
    'NEW_SUB_BASE_URL'
  )
);

module.exports = {
  nodeEnv,
  port,
  happCryptoApi,
  happCryptoFallbackApi,
  preferLegacyDeeplink,
  newSubBaseUrl,
  requestTimeoutMs,
  logLevel,
  miniappResultMode,
  allowDebugEndpoints,
  trustProxy,
};

const config = require('../config');
const logger = require('../logger');
const { AppError } = require('../errors');

function extractEncryptedUrl(payload) {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return null;

  const candidates = [
    payload.url,
    payload.encrypted_link,
    payload.encrypted_url,
    payload.encryptedUrl,
    payload.encryptedLink,
    payload.result,
    payload.data && payload.data.url,
    payload.data && payload.data.encrypted_link,
    payload.data && payload.data.encrypted_url,
    payload.data && payload.data.encryptedUrl,
    payload.data && payload.data.encryptedLink,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
}

function isValidRedirectTarget(value) {
  if (typeof value !== 'string' || value.length > 4096) return false;
  if (!(value.startsWith('http://') || value.startsWith('https://') || value.startsWith('happ://'))) {
    return false;
  }

  return true;
}

function isCrypt5DeepLink(value) {
  return typeof value === 'string' && value.startsWith('happ://crypt5/');
}

async function requestEncryptedUrl(apiUrl, urlToEncrypt, requestId) {
  const controller = new AbortController();
  const timeoutRef = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({ url: urlToEncrypt }),
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn('happ_crypto_non_200', {
        requestId,
        apiUrl,
        status: response.status,
      });
      throw AppError.encryptionFailed();
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw AppError.encryptionFailed();
    }

    const encryptedUrl = extractEncryptedUrl(payload);
    if (!isValidRedirectTarget(encryptedUrl)) {
      throw AppError.encryptionFailed();
    }

    return encryptedUrl;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      logger.warn('happ_crypto_timeout', {
        requestId,
        apiUrl,
        timeoutMs: config.requestTimeoutMs,
      });
      throw AppError.encryptionFailed();
    }

    if (err instanceof AppError) {
      throw err;
    }

    logger.error('happ_crypto_request_failed', {
      requestId,
      apiUrl,
      errName: err && err.name,
    });

    throw AppError.encryptionFailed();
  } finally {
    clearTimeout(timeoutRef);
  }
}

async function encryptUrl(urlToEncrypt, requestId) {
  const primaryUrl = await requestEncryptedUrl(config.happCryptoApi, urlToEncrypt, requestId);

  if (!config.preferLegacyDeeplink) {
    return primaryUrl;
  }

  if (!isCrypt5DeepLink(primaryUrl)) {
    return primaryUrl;
  }

  if (!config.happCryptoFallbackApi || config.happCryptoFallbackApi === config.happCryptoApi) {
    return primaryUrl;
  }

  try {
    const fallbackUrl = await requestEncryptedUrl(config.happCryptoFallbackApi, urlToEncrypt, requestId);
    logger.info('happ_crypto_legacy_fallback_used', {
      requestId,
      fromApi: config.happCryptoApi,
      toApi: config.happCryptoFallbackApi,
    });
    return fallbackUrl;
  } catch {
    logger.warn('happ_crypto_legacy_fallback_failed', {
      requestId,
      fromApi: config.happCryptoApi,
      toApi: config.happCryptoFallbackApi,
    });
    return primaryUrl;
  }
}

module.exports = {
  encryptUrl,
};

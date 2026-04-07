const config = require('../config');
const logger = require('../logger');
const { AppError } = require('../errors');

function extractEncryptedUrl(payload) {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return null;

  const candidates = [
    payload.url,
    payload.encrypted_url,
    payload.encryptedUrl,
    payload.result,
    payload.data && payload.data.url,
    payload.data && payload.data.encrypted_url,
    payload.data && payload.data.encryptedUrl,
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

async function encryptUrl(urlToEncrypt, requestId) {
  const controller = new AbortController();
  const timeoutRef = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(config.happCryptoApi, {
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
      logger.warn('happ_crypto_timeout', { requestId, timeoutMs: config.requestTimeoutMs });
      throw AppError.encryptionFailed();
    }

    if (err instanceof AppError) {
      throw err;
    }

    logger.error('happ_crypto_request_failed', {
      requestId,
      errName: err && err.name,
    });

    throw AppError.encryptionFailed();
  } finally {
    clearTimeout(timeoutRef);
  }
}

module.exports = {
  encryptUrl,
};

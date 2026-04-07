const config = require('../config');
const { AppError } = require('../errors');
const { assertValidToken } = require('../utils/token');
const { encryptUrl } = require('./happCryptoClient');

function buildInternalSubscriptionUrl(token) {
  return new URL(token, config.newSubBaseUrl).toString();
}

function looksLikeOpenSubscription(encryptedUrl, token) {
  if (typeof encryptedUrl !== 'string') return true;

  const needle = `/api/sub/${token}`;
  return encryptedUrl.includes(needle);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function makeMiniappBridgeHtml(targetUrl) {
  const escaped = escapeHtml(targetUrl);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Cache-Control" content="no-store" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting...</p>
  <script>
    window.location.replace(${JSON.stringify(targetUrl)});
  </script>
  <noscript>
    <a href="${escaped}">Continue</a>
  </noscript>
</body>
</html>`;
}

async function getEncryptedUrlForToken(token, requestId) {
  const validToken = assertValidToken(token);
  const internalUrl = buildInternalSubscriptionUrl(validToken);
  const encryptedUrl = await encryptUrl(internalUrl, requestId);

  if (looksLikeOpenSubscription(encryptedUrl, validToken)) {
    throw AppError.encryptionFailed();
  }

  return encryptedUrl;
}

function getMiniappResult(encryptedUrl) {
  switch (config.miniappResultMode) {
    case 'direct': {
      return {
        type: 'redirect',
        status: 307,
        location: encryptedUrl,
      };
    }
    case 'happ_add': {
      return {
        type: 'redirect',
        status: 307,
        location: `happ://add/${encryptedUrl}`,
      };
    }
    case 'html_bridge': {
      return {
        type: 'html',
        status: 200,
        body: makeMiniappBridgeHtml(`happ://add/${encryptedUrl}`),
      };
    }
    default:
      throw AppError.internal();
  }
}

module.exports = {
  getEncryptedUrlForToken,
  getMiniappResult,
};

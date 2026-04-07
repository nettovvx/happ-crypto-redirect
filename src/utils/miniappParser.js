const { URL } = require('node:url');

const { AppError } = require('../errors');
const { isValidToken } = require('./token');

const MINIAPP_PREFIX = 'happ://add/';
const ALLOWED_OLD_HOSTS = new Set(['link.nettovvx.me']);

function safeDecode(input) {
  let value = input;

  for (let i = 0; i < 2; i += 1) {
    if (!/%[0-9A-Fa-f]{2}/.test(value)) break;
    try {
      value = decodeURIComponent(value);
    } catch {
      throw AppError.invalidMiniappUrl();
    }
  }

  return value;
}

function parseMiniappUrl(rawInput) {
  if (typeof rawInput !== 'string' || rawInput.trim() === '') {
    throw AppError.invalidMiniappUrl();
  }

  const decoded = safeDecode(rawInput.trim());

  if (!decoded.startsWith(MINIAPP_PREFIX)) {
    throw AppError.invalidMiniappUrl();
  }

  const nestedSubscriptionUrl = decoded.slice(MINIAPP_PREFIX.length);

  let nested;
  try {
    nested = new URL(nestedSubscriptionUrl);
  } catch {
    throw AppError.invalidMiniappUrl();
  }

  if (!['http:', 'https:'].includes(nested.protocol)) {
    throw AppError.invalidMiniappUrl();
  }

  if (!ALLOWED_OLD_HOSTS.has(nested.hostname)) {
    throw AppError.invalidMiniappUrl();
  }

  const pathParts = nested.pathname.split('/').filter(Boolean);
  if (pathParts.length !== 3 || pathParts[0] !== 'api' || pathParts[1] !== 'sub') {
    throw AppError.invalidMiniappUrl();
  }

  const token = pathParts[2];

  if (!isValidToken(token)) {
    throw AppError.invalidMiniappUrl();
  }

  return token;
}

module.exports = {
  parseMiniappUrl,
};

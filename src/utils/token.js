const { AppError } = require('../errors');

const TOKEN_REGEX = /^[A-Za-z0-9_-]{6,128}$/;

function isValidToken(token) {
  if (typeof token !== 'string') return false;
  return TOKEN_REGEX.test(token);
}

function assertValidToken(token) {
  if (!isValidToken(token)) {
    throw AppError.invalidToken();
  }

  return token;
}

module.exports = {
  isValidToken,
  assertValidToken,
};

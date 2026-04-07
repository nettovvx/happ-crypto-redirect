const { randomUUID } = require('node:crypto');

function isSafeRequestId(value) {
  if (typeof value !== 'string') return false;
  if (value.length < 8 || value.length > 128) return false;
  return /^[A-Za-z0-9._:-]+$/.test(value);
}

function requestIdMiddleware(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const requestId = isSafeRequestId(incoming) ? incoming : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  next();
}

module.exports = {
  requestIdMiddleware,
};

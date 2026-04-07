const logger = require('../logger');
const { AppError, isAppError } = require('../errors');
const { maskToken } = require('../utils/mask');
const { sanitizePath } = require('../utils/logSanitizer');

function notFoundHandler(req, res) {
  res.status(404).json({
    ok: false,
    error: 'not_found',
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const normalizedError = isAppError(err) ? err : AppError.internal();

  logger.error('request_failed', {
    requestId: req.requestId,
    method: req.method,
    path: sanitizePath(req.path),
    status: normalizedError.status,
    code: normalizedError.code,
    token: maskToken((req.params && req.params.token) || res.locals.token),
    errName: err && err.name,
  });

  res.status(normalizedError.status).json({
    ok: false,
    error: normalizedError.code,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

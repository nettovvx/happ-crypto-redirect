const logger = require('../logger');
const { maskToken } = require('../utils/mask');
const { sanitizePath } = require('../utils/logSanitizer');

function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const elapsedNs = process.hrtime.bigint() - startedAt;
    const latencyMs = Number(elapsedNs / 1000000n);

    const token = req.params && req.params.token ? req.params.token : res.locals.token;

    logger.info('request_completed', {
      requestId: req.requestId,
      method: req.method,
      path: sanitizePath(req.path),
      status: res.statusCode,
      latencyMs,
      token: maskToken(token),
    });
  });

  next();
}

module.exports = {
  requestLogger,
};

const app = require('./app');
const config = require('./config');
const logger = require('./logger');

const server = app.listen(config.port, () => {
  logger.info('server_started', {
    port: config.port,
    env: config.nodeEnv,
    trustProxy: config.trustProxy,
  });
});

function shutdown(signal) {
  logger.info('server_stopping', { signal });

  server.close(() => {
    logger.info('server_stopped', { signal });
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('server_force_exit', { signal });
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

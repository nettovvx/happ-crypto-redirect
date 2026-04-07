const express = require('express');

const config = require('./config');
const healthRoutes = require('./routes/health');
const subRoutes = require('./routes/sub');
const miniappRoutes = require('./routes/miniapp');
const debugRoutes = require('./routes/debug');
const { requestIdMiddleware } = require('./utils/requestId');
const { requestLogger } = require('./middleware/requestLogger');
const { securityHeaders } = require('./middleware/securityHeaders');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);

app.use(requestIdMiddleware);
app.use(securityHeaders);
app.use(requestLogger);

app.use(healthRoutes);
app.use(subRoutes);
app.use(miniappRoutes);

if (config.allowDebugEndpoints) {
  app.use(debugRoutes);
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

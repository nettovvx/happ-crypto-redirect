const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const currentLevel = levels[(process.env.LOG_LEVEL || 'info').toLowerCase()] || levels.info;

function log(level, message, fields = {}) {
  if ((levels[level] || 100) < currentLevel) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...fields,
  };

  const line = JSON.stringify(record);

  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
}

module.exports = {
  debug: (message, fields) => log('debug', message, fields),
  info: (message, fields) => log('info', message, fields),
  warn: (message, fields) => log('warn', message, fields),
  error: (message, fields) => log('error', message, fields),
};

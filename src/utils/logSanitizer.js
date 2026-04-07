function sanitizePath(path) {
  if (typeof path !== 'string') return '';

  return path.replace(/^\/api\/sub\/[^/]+$/, '/api/sub/:token');
}

module.exports = {
  sanitizePath,
};

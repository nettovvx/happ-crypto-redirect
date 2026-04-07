function maskToken(token) {
  if (!token || typeof token !== 'string') return null;
  const normalized = token.trim();
  if (!normalized) return null;

  if (normalized.length <= 6) {
    return `${normalized.slice(0, 1)}***${normalized.slice(-1)}`;
  }

  return `${normalized.slice(0, 3)}...${normalized.slice(-3)}`;
}

module.exports = {
  maskToken,
};

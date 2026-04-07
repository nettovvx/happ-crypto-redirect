class AppError extends Error {
  constructor(code, status, message) {
    super(message || code);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }

  static invalidToken() {
    return new AppError('invalid_token', 400);
  }

  static invalidMiniappUrl() {
    return new AppError('invalid_miniapp_url', 400);
  }

  static encryptionFailed() {
    return new AppError('encryption_failed', 502);
  }

  static internal() {
    return new AppError('internal_error', 500);
  }
}

function isAppError(err) {
  return err instanceof AppError;
}

module.exports = {
  AppError,
  isAppError,
};

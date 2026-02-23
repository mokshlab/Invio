/**
 * Custom application error class.
 * Extends native Error with HTTP status codes and operational flag
 * to distinguish expected errors from programming bugs.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;

function createHttpError(statusCode, message, details) {
  const error = new Error(message || "Request failed");
  error.statusCode = statusCode || 500;
  if (details !== undefined) {
    error.details = details;
  }
  return error;
}

module.exports = { createHttpError };

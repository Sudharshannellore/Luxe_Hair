// Small helper for throwing errors with an HTTP status. Express 5 forwards
// rejected promises from async handlers to the error middleware automatically.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const httpError = (status, message, details) => new HttpError(status, message, details);

module.exports = { HttpError, httpError };

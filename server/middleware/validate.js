const { httpError } = require("../utils/httpError");

// validate(schema) parses req.body (or req.query) with a zod schema and replaces
// it with the parsed, coerced value. The first problem is returned as the message.
const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.join(".");
    throw httpError(400, field ? `${field}: ${issue.message}` : issue.message, result.error.issues);
  }
  if (source === "body") req.body = result.data;
  else req.validated = result.data;
  next();
};

module.exports = validate;

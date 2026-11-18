const { verifyToken } = require("../utils/jwt");
const { httpError } = require("../utils/httpError");

const readToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

const decode = (req) => {
  const token = readToken(req);
  if (!token) throw httpError(401, "Please sign in to continue.");
  try {
    return verifyToken(token);
  } catch {
    throw httpError(401, "Your session has expired. Please sign in again.");
  }
};

// Customer routes. (Admin endpoints are intentionally open: this project runs as a showcase.)
const requireUser = (req, res, next) => {
  const decoded = decode(req);
  req.userId = decoded.id;
  req.role = "user";
  next();
};

module.exports = { requireUser };

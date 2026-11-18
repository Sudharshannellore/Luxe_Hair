const jwt = require("jsonwebtoken");
const config = require("../config");

const generateToken = (id, role = "user", expiresIn = role === "admin" ? "12h" : "7d") =>
  jwt.sign({ id: String(id), role }, config.jwtSecret, { expiresIn });

const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

module.exports = { generateToken, verifyToken };

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server auth is not configured" });
  }

  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store only user ID
    req.user = decoded.id;

    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

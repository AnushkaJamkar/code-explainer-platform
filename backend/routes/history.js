const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const CodeHistory = require("../models/CodeHistory");

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const history = await CodeHistory.find({ user: req.user })
      .sort({ createdAt: -1 });

    return res.json(history);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

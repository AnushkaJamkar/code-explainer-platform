const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getHistoryForUser } = require("../utils/storage");

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const history = await getHistoryForUser(req.user);

    return res.json(history);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

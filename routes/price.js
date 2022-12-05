const express = require("express");
const router = express.Router();

router.get("/get24hourPrices", async (req, res) => {
  try {

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;

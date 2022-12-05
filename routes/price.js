const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/get24hourPrices", async (req, res) => {
  try {
    axios({
      url: 'https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet',
      method: 'post',
      data: {
        query: `
          tokenHourSnapshots(where: {token_: {symbol: "BTCB"}}){
              id
              priceNative
              date
            }
          `
      }
    }).then((result) => {
      console.log(result.data)
    });

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;

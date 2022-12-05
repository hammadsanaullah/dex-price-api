const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/get24hourPrices", async (req, res) => {
  try {
    let result = await axios({
      url: 'https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet',
      method: 'post',
      headers: {'content-type': 'application/json'},
      data: {
        query: `{
          tokenHourSnapshots(where: { token_: { symbol: "BTCB" } }) {
            id
            priceNative
            date
          }
        }
          `
      }
    })

    console.log(result?.data?.data?.tokenHourSnapshots);
    return res.status(200).json({message: "yayyy"});

  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;

const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/get24hourPrices", async (req, res) => {
  try {
    
    let tokenhoursnapshotsdata = await axios({
      url: 'https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet',
      method: 'post',
      headers: {'content-type': 'application/json', "Accept-Encoding": "utf-8"},
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
    });

    if(tokenhoursnapshotsdata.data.data.tokenHourSnapshots) {

    }

    console.log(tokenhoursnapshotsdata.data.data.tokenHourSnapshots);
    return res.status(200).json({message: "yayyy"});

  } catch (error) {
    return res.status(400).json({ message: error });
  }
});

module.exports = router;

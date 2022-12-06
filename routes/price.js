const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/get24hourPrices", async (req, res) => {
  try {
    // Date.now() + 86400000
    var dayStartTime = Math.round(Date.now() / 1000);
    dayStartTime = dayStartTime - 86400;
    console.log(dayStartTime);

    let tokenAhoursnapshotsdata = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenHourSnapshots(where: { token_: { symbol: "BTCB" }, date_gt: ${dayStartTime} }) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenBhoursnapshotsdata = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenHourSnapshots(where: { token_: { symbol: "USDT" }, date_gt: ${dayStartTime} }) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    //if tokenAhoursnapshot has data and tokenBhoursnapshot doesn't have data
    if (
      tokenAhoursnapshotsdata.data.data.tokenHourSnapshots.length != 0 &&
      tokenBhoursnapshotsdata.data.data.tokenHourSnapshots.length == 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      if (
        tokenAhoursnapshotsdata.data.data.tokenHourSnapshots[
          tokenAhoursnapshotsdata.data.data.tokenHourSnapshots.length - 1
        ].priceNative == 0
      ) {
        //have to return here that create a pair with WBNB
      } else {
        //if price is not 0 then iterate and get all the hourly price data
        var priceArray = [];
        for (
          var i = 0;
          i < tokenAhoursnapshotsdata.data.data.tokenHourSnapshots.length;
          i++
        ) {
          priceArray.push(
            tokenAhoursnapshotsdata.data.data.tokenHourSnapshots[i].priceNative
          );
        }

        let tokenBData = await axios({
          url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
          method: "post",
          headers: {
            "content-type": "application/json",
            "Accept-Encoding": "utf-8",
          },
          data: {
            query: `{
              tokenPrices(where: {token_: {symbol: "WBNB"}}) {
                id
                lastUsdPrice
                derivedNative
              }
            }
              `,
          },
        });
        if (tokenBData.data.data.tokenPrices.length != 0) {
          // for(var i = 0; i < tokenData.data.data.tokenPrices.length; i++ ) {

          // }
          // console.log(tokenData.data.data.tokenPrices)
          const lastPrice =
            tokenBData.data.data.tokenPrices[
              tokenBData.data.data.tokenPrices.length - 1
            ].derivedNative;
          //need to return lastprice with 24 hours timestamps
        } else {
          return res
            .status(500)
            .json({ message: "No pair created with WBNB!!!" });
        }
      }
    } else if (
      tokenAhoursnapshotsdata.data.data.tokenHourSnapshots.length == 0 &&
      tokenBhoursnapshotsdata.data.data.tokenHourSnapshots.length != 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      if (
        tokenBhoursnapshotsdata.data.data.tokenHourSnapshots[
          tokenBhoursnapshotsdata.data.data.tokenHourSnapshots.length - 1
        ].priceNative == 0
      ) {
        //have to return here that create a pair with WBNB
      } else {
        //if price is not 0 then iterate and get all the hourly price data
        var priceArray = [];
        for (
          var i = 0;
          i < tokenBhoursnapshotsdata.data.data.tokenHourSnapshots.length;
          i++
        ) {
          priceArray.push(
            tokenBhoursnapshotsdata.data.data.tokenHourSnapshots[i].priceNative
          );
        }

        let tokenAData = await axios({
          url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
          method: "post",
          headers: {
            "content-type": "application/json",
            "Accept-Encoding": "utf-8",
          },
          data: {
            query: `{
              tokenPrices(where: {token_: {symbol: "WBNB"}}) {
                id
                lastUsdPrice
                derivedNative
              }
            }
              `,
          },
        });
        if (tokenAData.data.data.tokenPrices.length != 0) {
          // for(var i = 0; i < tokenData.data.data.tokenPrices.length; i++ ) {

          // }
          // console.log(tokenData.data.data.tokenPrices)
          const lastPrice =
            tokenAData.data.data.tokenPrices[
              tokenAData.data.data.tokenPrices.length - 1
            ].derivedNative;
          //need to return lastprice with 24 hours timestamps
        } else {
          return res
            .status(500)
            .json({ message: "No pair created with WBNB!!!" });
        }
      }
    } else if (
      tokenAhoursnapshotsdata.data.data.tokenHourSnapshots.length != 0 &&
      tokenBhoursnapshotsdata.data.data.tokenHourSnapshots.length != 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      if (
        tokenAhoursnapshotsdata.data.data.tokenHourSnapshots[
          tokenAhoursnapshotsdata.data.data.tokenHourSnapshots.length - 1
        ].priceNative == 0 || tokenAhoursnapshotsdata.data.data.tokenHourSnapshots[
          tokenAhoursnapshotsdata.data.data.tokenHourSnapshots.length - 1
        ].priceNative == 0
      ) { 
        //return with create a pair with WBNB
      } else {

        var priceAArray = [];
        for (
          var i = 0;
          i < tokenAhoursnapshotsdata.data.data.tokenHourSnapshots.length;
          i++
        ) {
          priceArray.push(
            tokenAhoursnapshotsdata.data.data.tokenHourSnapshots[i].priceNative
          );
        }

        
        var priceBArray = [];
        for (
          var i = 0;
          i < tokenBhoursnapshotsdata.data.data.tokenHourSnapshots.length;
          i++
        ) {
          priceArray.push(
            tokenBhoursnapshotsdata.data.data.tokenHourSnapshots[i].priceNative
          );
        }
      }

    } else {
      //else check tokenData for last price
      let tokenData = await axios({
        url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
        method: "post",
        headers: {
          "content-type": "application/json",
          "Accept-Encoding": "utf-8",
        },
        data: {
          query: `{
            tokenPrices(where: {token_: {symbol: "BTCB"}}) {
              id
              lastUsdPrice
              derivedNative
            }
          }
            `,
        },
      });
      if (tokenData.data.data.tokenPrices.length != 0) {
        // for(var i = 0; i < tokenData.data.data.tokenPrices.length; i++ ) {

        // }
        // console.log(tokenData.data.data.tokenPrices)
        const lastPrice =
          tokenData.data.data.tokenPrices[
            tokenData.data.data.tokenPrices.length - 1
          ].derivedNative;
        //need to return lastprice with 24 hours timestamps
      } else {
        return res
          .status(500)
          .json({ message: "No pair created with WBNB!!!" });
      }
    }

    console.log(tokenAhoursnapshotsdata.data.data.tokenHourSnapshots);
    return res.status(200).json({ message: "yayyy" });
  } catch (error) {
    return res.status(400).json({ message: error });
  }
});

module.exports = router;

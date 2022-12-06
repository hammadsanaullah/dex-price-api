const express = require("express");
const axios = require("axios");
const router = express.Router();


async function generateTimeStampsForDay(previousDayTime) {

  var timeStamps = [];
  timeStamps[0] = previousDayTime;
  // var generatedObject = {};
  // var key = "data"
  // generatedObject[key] = [];

  for(var i = 1; i < 24; i++) {
    timeStamps.push(timeStamps[ i - 1 ] + 3600);
    // time = timeStamps[0];
    // if(timeStamps[i] <= tokenTimeStamps )
    // generatedObject[key].push({time: {"derivedBNB": 1}})
  }

  return timeStamps;
}

async function generateObjectResponseDay(timeStampsGenerated, timeStampsSubgraph) {
  var count = 0;
  for(var i = 0; i < timeStampsGenerated.length; i++) {
    if(timeStampsGenerated[i] <= timeStampsSubgraph[count]) {
      //keep adding timestamp of timestampssubgraph[count]
    } else {
      count = count + 1;
    }
  }
}

router.get("/get24hourPrices", async (req, res) => {
  try {

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
        return res
            .status(500)
            .json({ message: "No pair created with WBNB!!!" });

      } else {

        //if price is not 0 then iterate and get all the hourly price data
        var priceAArray = [];
        var timeStampsAArray = [];

        for (
          var i = 0;
          i < tokenAhoursnapshotsdata.data.data.tokenHourSnapshots.length;
          i++
        ) {
          priceAArray.push(
            tokenAhoursnapshotsdata.data.data.tokenHourSnapshots[i].priceNative
          );
          timeStampsAArray.push(
            tokenAhoursnapshotsdata.data.data.tokenHourSnapshots[i].date
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

        // var lastPrice;
        if (tokenBData.data.data.tokenPrices.length != 0) {
          var lastPrice =
            tokenBData.data.data.tokenPrices[
              tokenBData.data.data.tokenPrices.length - 1
            ].derivedNative;
          //need to return lastprice with 24 hours timestamps
        } else {
          return res
            .status(500)
            .json({ message: "No pair created with WBNB!!!" });
        }
/////////////////////
        var timestamps = await generateTimeStampsForDay(dayStartTime);
        for(var i = 0; i < timestamps.length; i++) {
          
        }
        let constructedData = { data: }
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
        ].priceNative == 0 ||
        tokenAhoursnapshotsdata.data.data.tokenHourSnapshots[
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
          priceAArray.push(
            tokenAhoursnapshotsdata.data.data.tokenHourSnapshots[i].priceNative
          );
        }

        var priceBArray = [];
        for (
          var i = 0;
          i < tokenBhoursnapshotsdata.data.data.tokenHourSnapshots.length;
          i++
        ) {
          priceBArray.push(
            tokenBhoursnapshotsdata.data.data.tokenHourSnapshots[i].priceNative
          );
        }

        //return the derivedBNB
      }
    } else {
      //else check tokenData for last price
      let tokenAData = await axios({
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

      let tokenBData = await axios({
        url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
        method: "post",
        headers: {
          "content-type": "application/json",
          "Accept-Encoding": "utf-8",
        },
        data: {
          query: `{
            tokenPrices(where: {token_: {symbol: "USDT"}}) {
              id
              lastUsdPrice
              derivedNative
            }
          }
            `,
        },
      });
      if (
        tokenAData.data.data.tokenPrices.length != 0 ||
        tokenBData.data.data.tokenPrices.length != 0
      ) {
        // for(var i = 0; i < tokenData.data.data.tokenPrices.length; i++ ) {

        // }
        // console.log(tokenData.data.data.tokenPrices)
        const lastPriceA =
          tokenAData.data.data.tokenPrices[
            tokenAData.data.data.tokenPrices.length - 1
          ].derivedNative;

        const lastPriceB =
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

    console.log(tokenAhoursnapshotsdata.data.data.tokenHourSnapshots);
    return res.status(200).json({ message: "yayyy" });
  } catch (error) {
    return res.status(400).json({ message: error });
  }
});

module.exports = router;

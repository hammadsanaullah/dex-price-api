const express = require("express");
const axios = require("axios");
const router = express.Router();

async function generateTimeStampsForDay(previousDayTime) {
  var timeStamps = [];
  timeStamps[0] = previousDayTime;

  for (var i = 1; i < 24; i++) {
    timeStamps.push(timeStamps[i - 1] + 3600);
  }

  return timeStamps;
}

async function generateObjectResponseDay(
  timeStampsGenerated,
  timeStampsSubgraphTokenA,
  priceTokenB,
  pricesTokenA
) {
  var generatedObject = [];
  var count = 0;

  for (var i = 0; i < timeStampsGenerated.length; i++) {
    if (timeStampsGenerated[i] <= timeStampsSubgraphTokenA[count]) {
      //keep adding timestamp of timestampssubgraph[count]
      time = timeStampsGenerated[i];
      generatedObject.push({ info: { time, derivedBNB: priceTokenB/pricesTokenA[count] } });
    } else if(timeStampsSubgraphTokenA[count] == undefined) {
      generatedObject.push({ info: { time, derivedBNB: priceTokenB/pricesTokenA[count-1] } });
    } else {
      count = count + 1;
      if(pricesTokenA[count] == undefined){
        generatedObject.push({ info: { time, derivedBNB: priceTokenB/pricesTokenA[count-1] } });
      } else {
        generatedObject.push({ info: { time, derivedBNB: priceTokenB/pricesTokenA[count] } });
      }
    }
  }
  return generatedObject
}

router.get("/get24hourPrices", async (req, res) => {
  try {
    var currentTime = Date.now();
    var dayStartTime = Math.round(currentTime / 1000);
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
          tokenHourSnapshots(where: { token_: { symbol: "USDT" }, date_gt: ${dayStartTime} }) {
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
          tokenHourSnapshots(where: { token_: { symbol: "BTCB" }, date_gt: ${dayStartTime} }) {
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
      //tested
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
        var generatedObject = await generateObjectResponseDay(
          timestamps,
          timeStampsAArray,
          lastPrice,
          priceAArray
        );

        return res.status(200).json({ data: generatedObject });

        // for (var i = 0; i < timestamps.length; i++) {}
        // let constructedData = { data: }
      }
    } else if (
      tokenAhoursnapshotsdata.data.data.tokenHourSnapshots.length == 0 &&
      tokenBhoursnapshotsdata.data.data.tokenHourSnapshots.length != 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
    //tested this one
      if (
        tokenBhoursnapshotsdata.data.data.tokenHourSnapshots[
          tokenBhoursnapshotsdata.data.data.tokenHourSnapshots.length - 1
        ].priceNative == 0
      ) {
        //have to return here that create a pair with WBNB
        return res
          .status(500)
          .json({ message: "No pair created with WBNB!!!" });
      } else {
        //if price is not 0 then iterate and get all the hourly price data
        var priceBArray = [];
        var timeStampsBArray = [];
        for (
          var i = 0;
          i < tokenBhoursnapshotsdata.data.data.tokenHourSnapshots.length;
          i++
        ) {
          priceBArray.push(
            tokenBhoursnapshotsdata.data.data.tokenHourSnapshots[i].priceNative
          );
          timeStampsBArray.push(
            tokenBhoursnapshotsdata.data.data.tokenHourSnapshots[i].date
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
          var lastPrice =
            tokenAData.data.data.tokenPrices[
              tokenAData.data.data.tokenPrices.length - 1
            ].derivedNative;
          //need to return lastprice with 24 hours timestamps
        } else {
          return res
            .status(500)
            .json({ message: "No pair created with WBNB!!!" });
        }

        var timestamps = await generateTimeStampsForDay(dayStartTime);

        var generatedObject = [];
        var count = 0;
      
        for (var i = 0; i < timestamps.length; i++) {
          if (timestamps[i] <= timeStampsBArray[count]) {
            //keep adding timestamp of timestampssubgraph[count]
            time = timestamps[i];
            generatedObject.push({ info: { time, derivedBNB: priceBArray[count]/lastPrice } });
          } else if(timeStampsBArray[count] == undefined) {
            generatedObject.push({ info: { time, derivedBNB: priceBArray[count - 1]/lastPrice } });
          } else {
            count = count + 1;
            if(priceBArray[count] == undefined){
              generatedObject.push({ info: { time, derivedBNB: priceBArray[count - 1]/lastPrice } });
            } else {
              generatedObject.push({ info: { time, derivedBNB: priceBArray[count]/lastPrice } });
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
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
        //return create a pair with WBNB
        return res
          .status(500)
          .json({ message: "No pair created with WBNB!!!" });
      } else {
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

        var priceBArray = [];
        var timeStampsBArray = [];
        for (
          var i = 0;
          i < tokenBhoursnapshotsdata.data.data.tokenHourSnapshots.length;
          i++
        ) {
          priceBArray.push(
            tokenBhoursnapshotsdata.data.data.tokenHourSnapshots[i].priceNative
          );
          timeStampsBArray.push(
            tokenBhoursnapshotsdata.data.data.tokenHourSnapshots[i].date
          );
        }

        var timestamps = await generateTimeStampsForDay(dayStartTime);

        var generatedObject = [];
        var count = 0;
      
        for (var i = 0; i < timestamps.length; i++) {
          if (timestamps[i] <= timeStampsAArray[count]) {
            //keep adding timestamp of timestampssubgraph[count]
            time = timestamps[i];
            generatedObject.push({ info: { time, derivedBNB: priceTokenB/pricesTokenA[count] } });
          } else if(timeStampsSubgraphTokenA[count] == undefined) {
            generatedObject.push({ info: { time, derivedBNB: priceTokenB/pricesTokenA[count-1] } });
          } else {
            count = count + 1;
            if(pricesTokenA[count] == undefined){
              generatedObject.push({ info: { time, derivedBNB: priceTokenB/pricesTokenA[count-1] } });
            } else {
              generatedObject.push({ info: { time, derivedBNB: priceTokenB/pricesTokenA[count] } });
            }
          }
        }
        var generatedObject = await generateObjectResponseDay(
          timestamps,
          timeStampsAArray,
          priceBArray,
          priceAArray
        );

        return res.status(200).json({ data: generatedObject });

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
        var lastPriceA =
          tokenAData.data.data.tokenPrices[
            tokenAData.data.data.tokenPrices.length - 1
          ].derivedNative;

        var lastPriceB =
          tokenBData.data.data.tokenPrices[
            tokenBData.data.data.tokenPrices.length - 1
          ].derivedNative;
        //need to return lastprice with 24 hours timestamps
      } else {
        return res
          .status(500)
          .json({ message: "No pair created with WBNB!!!" });
      }
      var timestamps = await generateTimeStampsForDay(dayStartTime);
      var generatedObject = await generateObjectResponseDay(
        timestamps,
        lastPriceA,
        lastPriceB,
        priceAArray
      );

      return res.status(200).json({ data: generatedObject });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;

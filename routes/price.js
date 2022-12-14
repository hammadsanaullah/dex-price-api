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

async function generateTimeStampsForWeek(previousDayTime) {
  var timeStamps = [];
  timeStamps[0] = previousDayTime;

  for (var i = 1; i < 7; i++) {
    timeStamps.push(timeStamps[i - 1] + 86400);
  }

  return timeStamps;
}

async function generateTimeStampsForMonth(previousDayTime) {
  var timeStamps = [];
  timeStamps[0] = previousDayTime;

  for (var i = 1; i < 30; i++) {
    timeStamps.push(timeStamps[i - 1] + 86400);
  }

  return timeStamps;
}

async function generateTimeStampsForYear(previousDayTime) {
  var timeStamps = [];
  timeStamps[0] = previousDayTime;

  for (var i = 1; i < 24; i++) {
    timeStamps.push(timeStamps[i - 1] + 1296000);
  }

  timeStamps[24] = Math.round(Date.now()/1000);

  return timeStamps;
}

router.get("/getDayPrices", async (req, res) => {
  try {
    var currentTime = Date.now();
    var dayStartTime = Math.round(currentTime / 1000);
    dayStartTime = dayStartTime - 86400;

    let tokenAhoursnapshotsdata = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenHourSnapshots(where: { token_: { symbol: "${req.body.symbolA}" }, date_gt: ${dayStartTime} }) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenAdaysnapshotsdataAll = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolA}" }}, first: 2) {
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
          tokenHourSnapshots(where: { token_: { symbol: "${req.body.symbolB}" }, date_gt: ${dayStartTime} }) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenBdaysnapshotsdataAll = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolB}" }}, first: 2) {
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
              tokenPrices(where: {token_: {symbol: "${req.body.symbolB}"}}) {
                id
                lastUsdPrice
                derivedNative
              }
            }
              `,
          },
        });

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

        var timestamps = await generateTimeStampsForDay(dayStartTime);

        var generatedObject = [];
        var count = 0;

        for (var i = 0; i < timestamps.length; i++) {
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsAArray[count]) {
              //keep adding timestamp of timestampssubgraph[count]
              generatedObject.push({
                info: { time, derivedBNB: lastPrice / priceAArray[count] },
              });
            } else if (timeStampsAArray[count] == undefined) {
              generatedObject.push({
                info: { time, derivedBNB: lastPrice / priceAArray[count - 1] },
              });
            } else {
              count = count + 1;
              if (priceAArray[count] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: lastPrice / priceAArray[count - 1],
                  },
                });
              } else {
                generatedObject.push({
                  info: { time, derivedBNB: lastPrice / priceAArray[count] },
                });
              }
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
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
              tokenPrices(where: {token_: {symbol: "${req.body.symbolA}"}}) {
                id
                lastUsdPrice
                derivedNative
              }
            }
              `,
          },
        });
        if (tokenAData.data.data.tokenPrices.length != 0) {

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
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsBArray[count]) {
              //keep adding timestamp of timestampssubgraph[count]
              generatedObject.push({
                info: { time, derivedBNB: priceBArray[count] / lastPrice },
              });
            } else if (timeStampsBArray[count] == undefined) {
              generatedObject.push({
                info: { time, derivedBNB: priceBArray[count - 1] / lastPrice },
              });
            } else {
              count = count + 1;
              if (priceBArray[count] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[count - 1] / lastPrice,
                  },
                });
              } else {
                generatedObject.push({
                  info: { time, derivedBNB: priceBArray[count] / lastPrice },
                });
              }
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
        var countB = 0;

        for (var i = 0; i < timestamps.length; i++) {
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsAArray[count]) {
              if (timestamps[i] <= timeStampsBArray[countB]) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB] / priceAArray[count],
                  },
                });
              } else if (priceBArray[countB] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                  },
                });
              } else {
                countB = countB + 1;
                if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                    },
                  });
                } else {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count],
                    },
                  });
                }
              }
            } else if (timeStampsAArray[count] == undefined) {
              if (timestamps[i] <= timeStampsBArray[countB]) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                  },
                });
              } else if (priceBArray[countB] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB:
                      priceBArray[countB - 1] / priceAArray[count - 1],
                  },
                });
              } else {
                countB = countB + 1;
                if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB:
                        priceBArray[countB - 1] / priceAArray[count - 1],
                    },
                  });
                } else {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                    },
                  });
                }
              }
            } else {
              count = count + 1;
              if (priceAArray[count] == undefined) {
                if (timestamps[i] <= timeStampsBArray[countB]) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                    },
                  });
                } else if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB:
                        priceBArray[countB - 1] / priceAArray[count - 1],
                    },
                  });
                } else {
                  countB = countB + 1;
                  if (priceBArray[countB] == undefined) {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB - 1] / priceAArray[count - 1],
                      },
                    });
                  } else {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB] / priceAArray[count - 1],
                      },
                    });
                  }
                }
              } else {
                if (timestamps[i] <= timeStampsBArray[countB]) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count],
                    },
                  });
                } else if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                    },
                  });
                } else {
                  countB = countB + 1;
                  if (priceBArray[countB] == undefined) {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB - 1] / priceAArray[count],
                      },
                    });
                  } else {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB: priceBArray[countB] / priceAArray[count],
                      },
                    });
                  }
                }
              }
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
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
            tokenPrices(where: {token_: {symbol: "${req.body.symbolA}"}}) {
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
            tokenPrices(where: {token_: {symbol: "${req.body.symbolB}"}}) {
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
       
        var lastPriceA =
          tokenAData.data.data.tokenPrices[
            tokenAData.data.data.tokenPrices.length - 1
          ].derivedNative;

        var lastPriceB =
          tokenBData.data.data.tokenPrices[
            tokenBData.data.data.tokenPrices.length - 1
          ].derivedNative;

      } else {
        return res
          .status(500)
          .json({ message: "No pair created with WBNB!!!" });
      }
      var timestamps = await generateTimeStampsForDay(dayStartTime);

      var generatedObject = [];
      var count = 0;
      var countB = 0;

      if (lastPriceA == 0) {
        for (var i = 0; i < timestamps.length; i++) {
          generatedObject.push({
            info: { time, derivedBNB: 0 },
          });
        }
      } else {
        for (var i = 0; i < timestamps.length; i++) {
          generatedObject.push({
            info: { time, derivedBNB: lastPriceB / lastPriceA },
          });
        }
      }

      return res.status(200).json({ data: generatedObject });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/getWeekPrices", async (req, res) => {
  try {
    var currentTime = Date.now();
    var dayStartTime = Math.round(currentTime / 1000);
    dayStartTime = dayStartTime - 604800;

    let tokenAdaysnapshotsdata = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolA}" }, date_gt: ${dayStartTime} }) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenAdaysnapshotsdataAll = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolA}" }}, first: 2) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenBdaysnapshotsdata = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolB}" }, date_gt: ${dayStartTime} }) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenBdaysnapshotsdataAll = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolB}" }}, first: 2) {
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
      tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0 &&
      tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length == 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      //tested
      if (
        tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
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
          i < tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
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
              tokenPrices(where: {token_: {symbol: "${req.body.symbolB}"}}) {
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

        var timestamps = await generateTimeStampsForWeek(dayStartTime);
        var generatedObject = [];
        var count = 0;

        for (var i = 0; i < timestamps.length; i++) {
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsSubgraphTokenA[count]) {
              //keep adding timestamp of timestampssubgraph[count]
              generatedObject.push({
                info: { time, derivedBNB: priceTokenB / pricesTokenA[count] },
              });
            } else if (timeStampsSubgraphTokenA[count] == undefined) {
              generatedObject.push({
                info: {
                  time,
                  derivedBNB: priceTokenB / pricesTokenA[count - 1],
                },
              });
            } else {
              count = count + 1;
              if (pricesTokenA[count] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceTokenB / pricesTokenA[count - 1],
                  },
                });
              } else {
                generatedObject.push({
                  info: { time, derivedBNB: priceTokenB / pricesTokenA[count] },
                });
              }
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
      }
    } else if (
      tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length == 0 &&
      tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      if (
        tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
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
          i < tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
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
              tokenPrices(where: {token_: {symbol: "${req.body.symbolA}"}}) {
                id
                lastUsdPrice
                derivedNative
              }
            }
              `,
          },
        });
        if (tokenAData.data.data.tokenPrices.length != 0) {
          
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

        var timestamps = await generateTimeStampsForWeek(dayStartTime);

        var generatedObject = [];
        var count = 0;

        for (var i = 0; i < timestamps.length; i++) {
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsBArray[count]) {
              //keep adding timestamp of timestampssubgraph[count]
              generatedObject.push({
                info: { time, derivedBNB: priceBArray[count] / lastPrice },
              });
            } else if (timeStampsBArray[count] == undefined) {
              generatedObject.push({
                info: { time, derivedBNB: priceBArray[count - 1] / lastPrice },
              });
            } else {
              count = count + 1;
              if (priceBArray[count] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[count - 1] / lastPrice,
                  },
                });
              } else {
                generatedObject.push({
                  info: { time, derivedBNB: priceBArray[count] / lastPrice },
                });
              }
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
      }
    } else if (
      tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0 &&
      tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      if (
        tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
        ].priceNative == 0 ||
        tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
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
          i < tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
          );
        }

        var priceBArray = [];
        var timeStampsBArray = [];
        for (
          var i = 0;
          i < tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
          );
        }

        var timestamps = await generateTimeStampsForWeek(dayStartTime);

        var generatedObject = [];
        var count = 0;
        var countB = 0;

        for (var i = 0; i < timestamps.length; i++) {
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsAArray[count]) {
              if (timestamps[i] <= timeStampsBArray[countB]) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB] / priceAArray[count],
                  },
                });
              } else if (priceBArray[countB] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                  },
                });
              } else {
                countB = countB + 1;
                if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                    },
                  });
                } else {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count],
                    },
                  });
                }
              }
            } else if (timeStampsAArray[count] == undefined) {
              if (timestamps[i] <= timeStampsBArray[countB]) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                  },
                });
              } else if (priceBArray[countB] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB:
                      priceBArray[countB - 1] / priceAArray[count - 1],
                  },
                });
              } else {
                countB = countB + 1;
                if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB:
                        priceBArray[countB - 1] / priceAArray[count - 1],
                    },
                  });
                } else {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                    },
                  });
                }
              }
            } else {
              count = count + 1;
              if (priceAArray[count] == undefined) {
                if (timestamps[i] <= timeStampsBArray[countB]) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                    },
                  });
                } else if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB:
                        priceBArray[countB - 1] / priceAArray[count - 1],
                    },
                  });
                } else {
                  countB = countB + 1;
                  if (priceBArray[countB] == undefined) {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB - 1] / priceAArray[count - 1],
                      },
                    });
                  } else {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB] / priceAArray[count - 1],
                      },
                    });
                  }
                }
              } else {
                if (timestamps[i] <= timeStampsBArray[countB]) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count],
                    },
                  });
                } else if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                    },
                  });
                } else {
                  countB = countB + 1;
                  if (priceBArray[countB] == undefined) {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB - 1] / priceAArray[count],
                      },
                    });
                  } else {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB: priceBArray[countB] / priceAArray[count],
                      },
                    });
                  }
                }
              }
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
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
            tokenPrices(where: {token_: {symbol: "${req.body.symbolA}"}}) {
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
            tokenPrices(where: {token_: {symbol: "${req.body.symbolB}"}}) {
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
      var timestamps = await generateTimeStampsForWeek(dayStartTime);

      var generatedObject = [];
      var count = 0;
      var countB = 0;

      if (lastPriceA == 0) {
        for (var i = 0; i < timestamps.length; i++) {
          generatedObject.push({
            info: { time, derivedBNB: 0 },
          });
        }
      } else {
        for (var i = 0; i < timestamps.length; i++) {
          generatedObject.push({
            info: { time, derivedBNB: lastPriceB / lastPriceA },
          });
        }
      }

      return res.status(200).json({ data: generatedObject });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/getMonthPrices", async (req, res) => {
  try {
    var currentTime = Date.now();
    var dayStartTime = Math.round(currentTime / 1000);
    dayStartTime = dayStartTime - 2592000;

    let tokenAdaysnapshotsdata = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolA}" }, date_gt: ${dayStartTime} }) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenAdaysnapshotsdataAll = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolA}" }}, first: 2) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenBdaysnapshotsdata = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolB}" }, date_gt: ${dayStartTime} }) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenBdaysnapshotsdataAll = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolB}" }}, first: 2) {
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
      tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0 &&
      tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length == 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      //tested
      if (
        tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
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
          i < tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
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
              tokenPrices(where: {token_: {symbol: "${req.body.symbolB}"}}) {
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

        var timestamps = await generateTimeStampsForMonth(dayStartTime);
        var generatedObject = [];
        var count = 0;

        for (var i = 0; i < timestamps.length; i++) {
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsSubgraphTokenA[count]) {
              //keep adding timestamp of timestampssubgraph[count]
              generatedObject.push({
                info: { time, derivedBNB: priceTokenB / pricesTokenA[count] },
              });
            } else if (timeStampsSubgraphTokenA[count] == undefined) {
              generatedObject.push({
                info: {
                  time,
                  derivedBNB: priceTokenB / pricesTokenA[count - 1],
                },
              });
            } else {
              count = count + 1;
              if (pricesTokenA[count] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceTokenB / pricesTokenA[count - 1],
                  },
                });
              } else {
                generatedObject.push({
                  info: { time, derivedBNB: priceTokenB / pricesTokenA[count] },
                });
              }
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
      }
    } else if (
      tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length == 0 &&
      tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      if (
        tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
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
          i < tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
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
              tokenPrices(where: {token_: {symbol: "${req.body.symbolA}"}}) {
                id
                lastUsdPrice
                derivedNative
              }
            }
              `,
          },
        });
        if (tokenAData.data.data.tokenPrices.length != 0) {

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

        var timestamps = await generateTimeStampsForMonth(dayStartTime);

        var generatedObject = [];
        var count = 0;

        for (var i = 0; i < timestamps.length; i++) {
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsBArray[count]) {
              //keep adding timestamp of timestampssubgraph[count]
              generatedObject.push({
                info: { time, derivedBNB: priceBArray[count] / lastPrice },
              });
            } else if (timeStampsBArray[count] == undefined) {
              generatedObject.push({
                info: { time, derivedBNB: priceBArray[count - 1] / lastPrice },
              });
            } else {
              count = count + 1;
              if (priceBArray[count] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[count - 1] / lastPrice,
                  },
                });
              } else {
                generatedObject.push({
                  info: { time, derivedBNB: priceBArray[count] / lastPrice },
                });
              }
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
      }
    } else if (
      tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0 &&
      tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      if (
        tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
        ].priceNative == 0 ||
        tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
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
          i < tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
          );
        }

        var priceBArray = [];
        var timeStampsBArray = [];
        for (
          var i = 0;
          i < tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
          );
        }

        var timestamps = await generateTimeStampsForMonth(dayStartTime);

        var generatedObject = [];
        var count = 0;
        var countB = 0;

        for (var i = 0; i < timestamps.length; i++) {
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsAArray[count]) {
              if (timestamps[i] <= timeStampsBArray[countB]) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB] / priceAArray[count],
                  },
                });
              } else if (priceBArray[countB] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                  },
                });
              } else {
                countB = countB + 1;
                if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                    },
                  });
                } else {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count],
                    },
                  });
                }
              }
            } else if (timeStampsAArray[count] == undefined) {
              if (timestamps[i] <= timeStampsBArray[countB]) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                  },
                });
              } else if (priceBArray[countB] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB:
                      priceBArray[countB - 1] / priceAArray[count - 1],
                  },
                });
              } else {
                countB = countB + 1;
                if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB:
                        priceBArray[countB - 1] / priceAArray[count - 1],
                    },
                  });
                } else {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                    },
                  });
                }
              }
            } else {
              count = count + 1;
              if (priceAArray[count] == undefined) {
                if (timestamps[i] <= timeStampsBArray[countB]) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                    },
                  });
                } else if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB:
                        priceBArray[countB - 1] / priceAArray[count - 1],
                    },
                  });
                } else {
                  countB = countB + 1;
                  if (priceBArray[countB] == undefined) {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB - 1] / priceAArray[count - 1],
                      },
                    });
                  } else {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB] / priceAArray[count - 1],
                      },
                    });
                  }
                }
              } else {
                if (timestamps[i] <= timeStampsBArray[countB]) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count],
                    },
                  });
                } else if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                    },
                  });
                } else {
                  countB = countB + 1;
                  if (priceBArray[countB] == undefined) {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB - 1] / priceAArray[count],
                      },
                    });
                  } else {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB: priceBArray[countB] / priceAArray[count],
                      },
                    });
                  }
                }
              }
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
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
            tokenPrices(where: {token_: {symbol: "${req.body.symbolA}"}}) {
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
            tokenPrices(where: {token_: {symbol: "${req.body.symbolB}"}}) {
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
        
        var lastPriceA =
          tokenAData.data.data.tokenPrices[
            tokenAData.data.data.tokenPrices.length - 1
          ].derivedNative;

        var lastPriceB =
          tokenBData.data.data.tokenPrices[
            tokenBData.data.data.tokenPrices.length - 1
          ].derivedNative;

      } else {
        return res
          .status(500)
          .json({ message: "No pair created with WBNB!!!" });
      }
      var timestamps = await generateTimeStampsForMonth(dayStartTime);

      var generatedObject = [];
      var count = 0;
      var countB = 0;

      if (lastPriceA == 0) {
        for (var i = 0; i < timestamps.length; i++) {
          generatedObject.push({
            info: { time, derivedBNB: 0 },
          });
        }
      } else {
        for (var i = 0; i < timestamps.length; i++) {
          generatedObject.push({
            info: { time, derivedBNB: lastPriceB / lastPriceA },
          });
        }
      }

      return res.status(200).json({ data: generatedObject });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/getYearPrices", async (req, res) => {
  try {
    var currentTime = Date.now();
    var dayStartTime = Math.round(currentTime / 1000);
    dayStartTime = dayStartTime - 31536000;

    let tokenAdaysnapshotsdata = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolA}" }, date_gt: ${dayStartTime} }) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenAdaysnapshotsdataAll = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolA}" }}, first: 2) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenBdaysnapshotsdata = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolB}" }, date_gt: ${dayStartTime} }) {
            id
            priceNative
            date
          }
        }
          `,
      },
    });

    let tokenBdaysnapshotsdataAll = await axios({
      url: "https://api.thegraph.com/subgraphs/name/hammadsanaullah/pancakeswapmumbaitestnet",
      method: "post",
      headers: {
        "content-type": "application/json",
        "Accept-Encoding": "utf-8",
      },
      data: {
        query: `{
          tokenDaySnapshots(where: { token_: { symbol: "${req.body.symbolB}" }}, first: 2) {
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
      tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0 &&
      tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length == 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      //tested
      if (
        tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
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
          i < tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
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
              tokenPrices(where: {token_: {symbol: "${req.body.symbolB}"}}) {
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

        var timestamps = await generateTimeStampsForYear(dayStartTime);
        var generatedObject = [];
        var count = 0;

        for (var i = 0; i < timestamps.length; i++) {
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsSubgraphTokenA[count]) {
              //keep adding timestamp of timestampssubgraph[count]
              generatedObject.push({
                info: { time, derivedBNB: priceTokenB / pricesTokenA[count] },
              });
            } else if (timeStampsSubgraphTokenA[count] == undefined) {
              generatedObject.push({
                info: {
                  time,
                  derivedBNB: priceTokenB / pricesTokenA[count - 1],
                },
              });
            } else {
              count = count + 1;
              if (pricesTokenA[count] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceTokenB / pricesTokenA[count - 1],
                  },
                });
              } else {
                generatedObject.push({
                  info: { time, derivedBNB: priceTokenB / pricesTokenA[count] },
                });
              }
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
      }
    } else if (
      tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length == 0 &&
      tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      if (
        tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
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
          i < tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
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
              tokenPrices(where: {token_: {symbol: "${req.body.symbolA}"}}) {
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

        var timestamps = await generateTimeStampsForYear(dayStartTime);

        var generatedObject = [];
        var count = 0;

        for (var i = 0; i < timestamps.length; i++) {
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsBArray[count]) {
              //keep adding timestamp of timestampssubgraph[count]
              generatedObject.push({
                info: { time, derivedBNB: priceBArray[count] / lastPrice },
              });
            } else if (timeStampsBArray[count] == undefined) {
              generatedObject.push({
                info: { time, derivedBNB: priceBArray[count - 1] / lastPrice },
              });
            } else {
              count = count + 1;
              if (priceBArray[count] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[count - 1] / lastPrice,
                  },
                });
              } else {
                generatedObject.push({
                  info: { time, derivedBNB: priceBArray[count] / lastPrice },
                });
              }
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
      }
    } else if (
      tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0 &&
      tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length != 0
    ) {
      //if tokenhoursnapshots exist but the priceNative is 0
      if (
        tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
        ].priceNative == 0 ||
        tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[
          tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length - 1
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
          i < tokenAdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsAArray.push(
            tokenAdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
          );
        }

        var priceBArray = [];
        var timeStampsBArray = [];
        for (
          var i = 0;
          i < tokenBdaysnapshotsdata.data.data.tokenDaySnapshots.length;
          i++
        ) {
          priceBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].priceNative
          );
          timeStampsBArray.push(
            tokenBdaysnapshotsdata.data.data.tokenDaySnapshots[i].date
          );
        }

        var timestamps = await generateTimeStampsForYear(dayStartTime);

        var generatedObject = [];
        var count = 0;
        var countB = 0;

        for (var i = 0; i < timestamps.length; i++) {
          time = timestamps[i];
          if (
            timestamps[i] <
              tokenAdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date ||
            timestamps[i] <
              tokenBdaysnapshotsdataAll.data.data.tokenDaySnapshots[0].date
          ) {
            generatedObject.push({
              info: { time, derivedBNB: 0 },
            });
          } else {
            if (timestamps[i] <= timeStampsAArray[count]) {
              if (timestamps[i] <= timeStampsBArray[countB]) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB] / priceAArray[count],
                  },
                });
              } else if (priceBArray[countB] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                  },
                });
              } else {
                countB = countB + 1;
                if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                    },
                  });
                } else {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count],
                    },
                  });
                }
              }
            } else if (timeStampsAArray[count] == undefined) {
              if (timestamps[i] <= timeStampsBArray[countB]) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                  },
                });
              } else if (priceBArray[countB] == undefined) {
                generatedObject.push({
                  info: {
                    time,
                    derivedBNB:
                      priceBArray[countB - 1] / priceAArray[count - 1],
                  },
                });
              } else {
                countB = countB + 1;
                if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB:
                        priceBArray[countB - 1] / priceAArray[count - 1],
                    },
                  });
                } else {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                    },
                  });
                }
              }
            } else {
              count = count + 1;
              if (priceAArray[count] == undefined) {
                if (timestamps[i] <= timeStampsBArray[countB]) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count - 1],
                    },
                  });
                } else if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB:
                        priceBArray[countB - 1] / priceAArray[count - 1],
                    },
                  });
                } else {
                  countB = countB + 1;
                  if (priceBArray[countB] == undefined) {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB - 1] / priceAArray[count - 1],
                      },
                    });
                  } else {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB] / priceAArray[count - 1],
                      },
                    });
                  }
                }
              } else {
                if (timestamps[i] <= timeStampsBArray[countB]) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB] / priceAArray[count],
                    },
                  });
                } else if (priceBArray[countB] == undefined) {
                  generatedObject.push({
                    info: {
                      time,
                      derivedBNB: priceBArray[countB - 1] / priceAArray[count],
                    },
                  });
                } else {
                  countB = countB + 1;
                  if (priceBArray[countB] == undefined) {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB:
                          priceBArray[countB - 1] / priceAArray[count],
                      },
                    });
                  } else {
                    generatedObject.push({
                      info: {
                        time,
                        derivedBNB: priceBArray[countB] / priceAArray[count],
                      },
                    });
                  }
                }
              }
            }
          }
        }

        return res.status(200).json({ data: generatedObject });
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
            tokenPrices(where: {token_: {symbol: "${req.body.symbolA}"}}) {
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
            tokenPrices(where: {token_: {symbol: "${req.body.symbolB}"}}) {
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
      var timestamps = await generateTimeStampsForYear(dayStartTime);

      var generatedObject = [];
      var count = 0;
      var countB = 0;

      if (lastPriceA == 0) {
        for (var i = 0; i < timestamps.length; i++) {
          generatedObject.push({
            info: { time, derivedBNB: 0 },
          });
        }
      } else {
        for (var i = 0; i < timestamps.length; i++) {
          generatedObject.push({
            info: { time, derivedBNB: lastPriceB / lastPriceA },
          });
        }
      }

      return res.status(200).json({ data: generatedObject });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
module.exports = router;

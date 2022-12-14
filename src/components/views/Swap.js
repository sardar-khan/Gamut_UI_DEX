import React, { useState, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useWeb3React } from "@web3-react/core";
import tw from "twin.macro";
import { styled } from "@mui/material/styles";
import History from "./History";
import './Navigation.css'
import {
  Grid,
  Paper,
  useMediaQuery,
  Modal,
  TextField,
  Button,
  FormControl,
  Typography,
  Slider,
  InputBase
} from "@mui/material";
import { Stack } from "@mui/system";
import {
  ArrowCircleDownRounded,
  Settings,
  ArrowForward,
} from "@mui/icons-material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { createChart } from "lightweight-charts";
import {
  getTokenBalance,
  getPoolAddress,
  getPoolData,
  swapTokens,
  batchSwapTokens,
  tokenApproval,
  approveToken,
  getSwapFeePercent,
  calculateSwap,
  calcOutput,
  getMiddleToken
} from "../../config/web3";
import { useTokenPricesData } from "../../config/chartData";
import { useSwapTransactionsData } from "../../config/chartData";
import { uniList } from "../../config/constants";
import { poolList } from "../../config/constants";
import { contractAddresses } from "../../config/constants";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: "theme.palette.text.secondary",
}));

// drop down style start
const BootstrapInput = styled(InputBase)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(3),
  },
  "& .MuiInputBase-input": {
    borderRadius: 4,
    position: "relative",
    backgroundColor: "#07071c",
    border: "0px solid #ced4da",
    fontSize: 20,
    textAlign: "start",
    padding: "10px 16px 10px 12px",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    // Use the system font instead of the default Roboto font.
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
    "&:focus": {
      borderRadius: 4,
      borderColor: "#80bdff",
      boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
      color: "white"
    },
  },
  icon: {
    color: "white",
  },
}));

export default function Swap() {
  const selected_chain = useSelector((state) => state.selectedChain);
  const { account, connector } = useWeb3React();
  const dispatch = useDispatch();
  const darkFontColor = "#FFFFFF";
  const grayColor = "#6d6d7d";
  const [setting, setSetting] = useState(false);
  const [mopen, setMopen] = useState(false);
  const [inValue, setInValue] = useState(0);
  const [selected, setSelected] = React.useState(0);
  const [query, setQuery] = useState("");
  const [valueEth, setValueEth] = useState(0);
  const [poolAddress, setPoolAddress] = useState([]);
  const [inToken, setInToken] = useState(uniList[selected_chain][0]);
  const [outToken, setOutToken] = useState(uniList[selected_chain][1]);
  const [inBal, setInBal] = useState(0);
  const [outBal, setOutBal] = useState(0);
  // const [fee, setFee] = useState(0);
  const [approval, setApproval] = useState(false);
  const [approvedVal, setApprovedVal] = useState(0);
  const [filterData, setFilterData] = useState(uniList[selected_chain]);
  const [limitedout, setLimitedout] = useState(false);
  const [swapFee, setSwapFee] = useState(0);
  const [middleToken, setMiddleToken] = useState(null);
  const [middleTokenSymbol, setMiddleTokenSymbol] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [tokenPr, setTokenPr] = useState(0);
  const [slippage, setSlippage] = useState(0.1);
  const [slippageFlag, setSlippageFlag] = useState(false);
  const [deadline, setDeadline] = useState(900);
  const [deadlineFlag, setDeadlineFlag] = useState(false);
  const [noChartData, setNoChartData] = useState(false);
  const [isExist, setIsExist] = useState(false);

  const pricesData = useTokenPricesData(poolAddress);
  const swapTransactionData = useSwapTransactionsData(account);
  const chartRef = useRef();
  const dark = false;
  const isMobile = useMediaQuery("(max-width:600px)");

  const StyledModal = tw.div`
    flex
    flex-col
    relative
    m-auto
    top-1/4
    p-6
    min-h-min
    transform -translate-x-1/2 -translate-y-1/2
    sm:w-1/3 w-11/12
  `;

  const handleMopen = (val) => {
    setSelected(val);
    setMopen(true);
  };

  const handleClose = () => setMopen(false);
  const handleValue = async (event) => {
    setInValue(event.target.value * 1);
    // setFee(event.target.value * swapFee);
    if (account)
      checkApproved(inToken, event.target.value);
  };

  const filterToken = (e) => {
    let search_qr = e.target.value;
    setQuery(search_qr);
    if (search_qr.length !== 0) {
      const filterDT = uniList[selected_chain].filter((item) => {
        return item["symbol"].toLowerCase().indexOf(search_qr) !== -1;
      });
      setFilterData(filterDT);
    } else {
      setFilterData(uniList[selected_chain]);
    }
  };

  const checkApproved = async (token, val) => {
    const provider = await connector.getProvider();
    if (token['address'] !== '0x0000000000000000000000000000000000000000') {
      const approval = await tokenApproval(
        account,
        provider,
        token["address"],
        contractAddresses[selected_chain]["router"]
      );

      setApproval(approval * 1 >= val * 1);
      setApprovedVal(Number(approval));
    } else {
      setApproval(true);
    }
  };

  // const calcSlippage = async (inToken, poolData, input, output) => {
  //   let balance_from;
  //   let balance_to;
  //   let weight_from;
  //   let weight_to;

  //   if (inToken["address"] === poolData.tokens[0]) {
  //     balance_from = poolData.balances[0];
  //     balance_to = poolData.balances[1];
  //     weight_from = poolData.weights[0];
  //     weight_to = poolData.weights[1];
  //   } else {
  //     balance_from = poolData.balances[1];
  //     balance_to = poolData.balances[0];
  //     weight_from = poolData.weights[1];
  //     weight_to = poolData.weights[0];
  //   }

  //   let pricePool = balance_from / weight_from / (balance_to / weight_to);
  //   let priceTrade = input / output;

  //   let slip = (1 - pricePool / priceTrade) * 100;

  //   return slip;
  // };

  const selectToken = async (token, selected) => {
    handleClose();
    var bal = 0;
    if (selected === 0) {
      if (token["address"] !== inToken["address"]) {
        setInToken({ ...token });
        setInValue(0);
        setValueEth(0);
      }
    } else if (selected === 1) {
      if (token["address"] !== outToken["address"]) {
        setOutToken({ ...token });
        setInValue(0);
        setValueEth(0);
      }
    }
    if (account) {
      const provider = await connector.getProvider();
      bal = await getTokenBalance(provider, token["address"], account);
      if (selected === 0) {
        setInBal(bal);
        // let tempData = uniList[selected_chain].filter((item) => {
        //   return item["address"] !== token["address"];
        // });
        checkApproved(token, inValue);

        let inLimBal = bal.toString().replaceAll(",", "");
        if (
          Number(inValue) <= Number(inLimBal)
        )
          setLimitedout(false);
        else setLimitedout(true);
      } else if (selected === 1) {
        setOutBal(bal);
        // let tempData = uniList[selected_chain].filter((item) => {
        //   return item["address"] !== token["address"];
        // });
      }
    }
  };

  const reverseToken = async () => {
    let tempToken = outToken;
    await selectToken(inToken, 1);
    await selectToken(tempToken, 0);
  };

  const findMiddleToken = async () => {
    const provider = await connector.getProvider();
    let inVal = (Number(inValue) === 0) ? 1 : inValue;
    let suitableRouter = [];
    if (inToken['address'] === "0x0000000000000000000000000000000000000000") {
      let canToken = { ...inToken };
      canToken['address'] = "0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b";
      suitableRouter = await getMiddleToken(inVal, canToken, outToken, uniList[selected_chain], provider, contractAddresses[selected_chain]["hedgeFactory"], swapFee);
    } else if (outToken['address'] === "0x0000000000000000000000000000000000000000") {
      let canToken = { ...outToken };
      canToken['address'] = "0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b";
      suitableRouter = await getMiddleToken(inVal, inToken, canToken, uniList[selected_chain], provider, contractAddresses[selected_chain]["hedgeFactory"], swapFee);
    } else {
      suitableRouter = await getMiddleToken(inVal, inToken, outToken, uniList[selected_chain], provider, contractAddresses[selected_chain]["hedgeFactory"], swapFee);
    }
    setMiddleToken(suitableRouter);
    getMiddleTokenSymbol(suitableRouter);
    return suitableRouter;
  };

  const executeSwap = async () => {
    if (account && inToken["address"] !== outToken["address"]) {
      const provider = await connector.getProvider();
      const limit = valueEth * (1 - swapFee - slippage * 0.01);
      setSwapping(true);
      if (middleToken)
        await batchSwapTokens(
          provider,
          inToken["address"],
          outToken["address"],
          middleToken,
          inValue * 1,
          account,
          limit,
          deadline,
          contractAddresses[selected_chain]["router"]
        );
      else
        await swapTokens(
          provider,
          inToken["address"],
          outToken["address"],
          inValue * 1,
          account,
          limit,
          deadline,
          contractAddresses[selected_chain]["router"]
        );
      setSwapping(false);
    }
  };

  const approveTk = async (amount) => {
    if (account) {
      const provider = await connector.getProvider();
      setUnlocking(true);
      const approvedToken = await approveToken(
        account,
        provider,
        inToken["address"],
        amount * 1.01,
        contractAddresses[selected_chain]["router"]
      );
      setUnlocking(false);
      setApproval(approvedToken >= inValue);
    }
  };

  const setInLimit = (point) => {
    if (inBal) {
      let val = inBal.toString().replaceAll(",", "");
      setInValue(numFormat(val / point));
      if (point === 1)
        setLimitedout(false);
      else
        setLimitedout(true);
    }
  };

  const clickConWallet = () => {
    document.getElementById("connect_wallet_btn").click();
  };

  const getMiddleTokenSymbol = (tokens) => {
    if (tokens) {
      if (tokens.length === 2) {
        const result1 = uniList[selected_chain].filter((item) => {
          return item.address === tokens[0]["address"];
        });

        const result2 = uniList[selected_chain].filter((item) => {
          return item.address === tokens[1]["address"];
        });

        setMiddleTokenSymbol([result1[0].symbol, result2[0].symbol]);
      } else {
        const result1 = uniList[selected_chain].filter((item) => {
          return item.address === tokens[0]["address"];
        });

        setMiddleTokenSymbol([result1[0].symbol]);
      }
    } else {
      setMiddleTokenSymbol(["", ""]);
    }
  };

  const getStatusData = async (value) => {
    if (account && inToken !== outToken) {
      let inLimBal = inBal.toString().replaceAll(",", "");
      const provider = await connector.getProvider();
      const midToken = await findMiddleToken();
      let canToken1 = { ...inToken };
      let canToken2 = { ...outToken };
      if (inToken['address'] === "0x0000000000000000000000000000000000000000")
        canToken1['address'] = "0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b";
      if (outToken['address'] === "0x0000000000000000000000000000000000000000")
        canToken2['address'] = "0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b";

      if (midToken !== undefined && midToken !== null) {
        setIsExist(true);
        if (value * 1 !== 0) {
          let amountOut = await calcOutput(
            midToken,
            provider,
            value,
            canToken1,
            canToken2,
            contractAddresses[selected_chain]["hedgeFactory"],
            swapFee
          );
          amountOut =
            amountOut * 1 === 0
              ? 0
              : numFormat(amountOut);
          setValueEth(amountOut);
          setTokenPr(numFormat(amountOut / value));
          if (Number(value) > Number(inLimBal)) setLimitedout(true);
          else setLimitedout(false);
        } else {
          setValueEth(0);
        }

        let tokenPr = await calcOutput(
          midToken,
          provider,
          0.000001,
          canToken1,
          canToken2,
          contractAddresses[selected_chain]["hedgeFactory"],
          swapFee
        );
        setTokenPr(numFormat(tokenPr * 1000000));

        if (midToken.length === 1) {
          const poolAddress1 = await getPoolAddress(
            provider,
            canToken1["address"],
            midToken[0]["address"],
            contractAddresses[selected_chain]["hedgeFactory"]
          );
          const poolAddress2 = await getPoolAddress(
            provider,
            midToken[0]["address"],
            canToken2["address"],
            contractAddresses[selected_chain]["hedgeFactory"]
          );
          setPoolAddress([
            poolAddress1.toLowerCase(),
            poolAddress2.toLowerCase(),
          ]);
        } else {
          const poolAddress1 = await getPoolAddress(
            provider,
            canToken1["address"],
            midToken[0]["address"],
            contractAddresses[selected_chain]["hedgeFactory"]
          );
          const poolAddress2 = await getPoolAddress(
            provider,
            midToken[0]["address"],
            midToken[1]["address"],
            contractAddresses[selected_chain]["hedgeFactory"]
          );
          const poolAddress3 = await getPoolAddress(
            provider,
            midToken[1]["address"],
            canToken2["address"],
            contractAddresses[selected_chain]["hedgeFactory"]
          );
          setPoolAddress([
            poolAddress1.toLowerCase(),
            poolAddress2.toLowerCase(),
            poolAddress3.toLowerCase(),
          ]);
        }
      } else {
        try {
          const poolAddress = await getPoolAddress(
            provider,
            canToken1["address"],
            canToken2["address"],
            contractAddresses[selected_chain]["hedgeFactory"]
          );
          if (poolAddress !== "0x0000000000000000000000000000000000000000") {
            setIsExist(true);
            const poolData = await getPoolData(
              provider,
              poolAddress
            );

            if (value * 1 !== 0) {
              let amountOut = await calculateSwap(
                canToken1["address"],
                poolData,
                value
              );

              amountOut =
                amountOut * 1 === 0
                  ? 0
                  : numFormat(amountOut);
              setValueEth(amountOut);
              setTokenPr(numFormat(amountOut / value));
              if (Number(value) > Number(inLimBal)) setLimitedout(true);
              else setLimitedout(false);
            } else {
              setValueEth(0);
            }

            setPoolAddress([poolAddress.toLowerCase()]);
            var tokenPr = await calculateSwap(
              canToken1["address"],
              poolData,
              0.000001);
            setTokenPr(numFormat(tokenPr * 1000000));
          } else {
            setIsExist(false);
          }
        } catch (e) {
          console.log(e.message);
          setIsExist(false);
        }
      }
    } else if (inToken !== outToken) {
      for (var i = 0; i < poolList[selected_chain].length; i++) {
        if (
          (poolList[selected_chain][i]["symbols"][0] === inToken["symbol"] &&
            poolList[selected_chain][i]["symbols"][1] === outToken["symbol"]) ||
          (poolList[selected_chain][i]["symbols"][1] === inToken["symbol"] &&
            poolList[selected_chain][i]["symbols"][0] === outToken["symbol"])
        ) {
          setIsExist(true);
          setPoolAddress([
            poolList[selected_chain][i]["address"].toLowerCase(),
          ]);
          break;
        }
      }
    } else {
      setIsExist(false);
      setPoolAddress([]);
    }
  };

  const numFormat = (val) => {
    if (Number(val) > 1)
      return Number(val).toFixed(4) * 1;
    else if (Number(val) > 0.001)
      return Number(val).toFixed(6) * 1;
    else if (Number(val) > 0.00001)
      return Number(val).toFixed(8) * 1;
    else
      return Number(val).toFixed(8) * 1;
  }

  const valueLabelFormat = (value) => {
    return value + "%";
  }

  const formattedPricesData = useMemo(() => {
    if (pricesData && pricesData.prices) {
      var result = [];
      const poolTokenPrices = pricesData.prices;
      if (poolAddress.length === 1) {
        poolTokenPrices.map(item => {
          if (item.token0.id.toLowerCase() === inToken["address"].toLowerCase()) {
            result.push({
              time: parseInt(item.timestamp, 10),
              value: numFormat(item.token0Price / (Number(item.token1Price) + 0.000000000001)),
            });
          } else {
            result.push({
              time: parseInt(item.timestamp, 10),
              value: numFormat(item.token1Price),
            });
          }
          return null;
        });
      } else if (poolAddress.length === 2) {
        for (var i = 1; i < poolTokenPrices.length; i++) {
          if (poolTokenPrices[i].pool.id.toLowerCase() === poolAddress[0].toLowerCase()) {
            for (var j = i - 1; j >= 0; j--)
              if (poolTokenPrices[j].pool.id.toLowerCase() === poolAddress[1].toLowerCase()) {
                var tempPrice =
                  poolTokenPrices[i].token0.id.toLowerCase() === inToken["address"].toLowerCase()
                    ? numFormat(poolTokenPrices[i].token0Price / (Number(poolTokenPrices[i].token1Price) + 0.000000000001))
                    : poolTokenPrices[i].token1Price;
                var lastPrice =
                  poolTokenPrices[j].token0.id.toLowerCase() === outToken["address"].toLowerCase()
                    ? tempPrice * poolTokenPrices[j].token1Price
                    : tempPrice * numFormat(poolTokenPrices[j].token0Price / (Number(poolTokenPrices[j].token1Price) + 0.000000000001));
                result.push({
                  time: parseInt(poolTokenPrices[i].timestamp, 10),
                  value: numFormat(lastPrice),
                });
                break;
              }
          }
        }
      } else if (poolAddress.length === 3) {
        for (var ii = 2; ii < poolTokenPrices.length; ii++) {
          if (poolTokenPrices[ii].pool.id.toLowerCase() === poolAddress[0].toLowerCase()) {
            var tempArr = [];
            for (var jj = i - 1; jj >= 0; jj--)
              if (
                poolTokenPrices[jj].pool.id.toLowerCase() === poolAddress[1].toLowerCase() ||
                poolTokenPrices[jj].pool.id.toLowerCase() === poolAddress[2].toLowerCase()
              ) {
                if (tempArr.length === 0) tempArr.push(poolTokenPrices[jj]);
                else if (tempArr[0].pool.id.toLowerCase() !== poolTokenPrices[jj].pool.id.toLowerCase()) {
                  if (poolTokenPrices[jj].pool.id.toLowerCase() === poolAddress[1].toLowerCase()) {
                    var tempPrice1 =
                      poolTokenPrices[ii].token0.id.toLowerCase() === inToken["address"].toLowerCase()
                        ? numFormat(poolTokenPrices[ii].token0Price / (Number(poolTokenPrices[ii].token1Price) + 0.000000000001))
                        : poolTokenPrices[ii].token1Price;
                    var tempPrice2 =
                      poolTokenPrices[jj].token0.id.toLowerCase() ===
                        poolTokenPrices[ii].token0.id.toLowerCase() ||
                        poolTokenPrices[jj].token0.id.toLowerCase() ===
                        poolTokenPrices[ii].token1.id.toLowerCase()
                        ? numFormat(poolTokenPrices[jj].token0Price / (Number(poolTokenPrices[jj].token1Price) + 0.000000000001)) * tempPrice1
                        : poolTokenPrices[jj].token1Price * tempPrice1;
                    var lastPrice1 =
                      tempArr[0].token0.id.toLowerCase() === outToken["address"].toLowerCase()
                        ? tempPrice2 * numFormat(tempArr[0].token0Price / (Number(tempArr[0].token1Price) + 0.000000000001))
                        : tempPrice2 * tempArr[0].token1Price;
                    result.push({
                      time: parseInt(poolTokenPrices[ii].timestamp, 10),
                      value: numFormat(lastPrice1),
                    });
                    break;
                  } else {
                    var tempPrice11 =
                      poolTokenPrices[ii].token0.id.toLowerCase() === inToken["address"].toLowerCase()
                        ? numFormat(poolTokenPrices[ii].token0Price / (Number(poolTokenPrices[ii].token1Price) + 0.000000000001))
                        : poolTokenPrices[ii].token1Price;
                    var tempPrice12 =
                      tempArr[0].token0.id.toLowerCase() ===
                        poolTokenPrices[ii].token0.id.toLowerCase() ||
                        tempArr[0].token0.id.toLowerCase() ===
                        poolTokenPrices[ii].token1.id.toLowerCase()
                        ? numFormat(tempArr[0].token0Price / (Number(tempArr[0].token1Price) + 0.000000000001)) * tempPrice11
                        : tempArr[0].token1Price * tempPrice11;
                    var lastPrice2 =
                      poolTokenPrices[jj].token0.id.toLowerCase() === outToken["address"].toLowerCase()
                        ? tempPrice12 * numFormat(poolTokenPrices[jj].token0Price / (Number(poolTokenPrices[jj].token1Price) + 0.000000000001))
                        : tempPrice12 * poolTokenPrices[jj].token1Price;
                    result.push({
                      time: parseInt(poolTokenPrices[ii].timestamp, 10),
                      value: numFormat(lastPrice2),
                    });
                    break;
                  }
                }
              }
          }
        }
      }
      return result;
    } else {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricesData]);

  const transactionsData = useMemo(() => {
    if (account) {
      if (swapTransactionData.swaps && swapTransactionData.swaps.length !== 0) {
        let result = [];
        result = swapTransactionData.swaps.map(item => {
          return item;
        });
        return result;
      } else {
        return [];
      }
    } else {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapTransactionData]);

  // Chart --->
  var chart;
  var areaSeries = null;

  function syncToInterval() {
    if (areaSeries) {
      chart.removeSeries(areaSeries);
      areaSeries = null;
    }
    areaSeries = dark
      ? chart.addAreaSeries({
        topColor: "#0580f482",
        bottomColor: "#0580f42e",
        lineColor: "#0580f4",
        lineWidth: 2,
      })
      : chart.addAreaSeries({
        topColor: "#0580f482",
        bottomColor: "#0580f42e",
        lineColor: "#0580f4",
        lineWidth: 2,
      });
    areaSeries.setData(formattedPricesData);
  }

  const loadChart = () => {
    if (chartRef.current.children[0]) {
      chartRef.current.removeChild(chartRef.current.children[0]);
    }

    chart = createChart(chartRef.current, {
      height: 350,
      layout: {
        backgroundColor: "#12122c",
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          color: "rgba(42, 46, 57, 0.5)",
        },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
      },
      crosshair: {
        horzLine: {
          visible: false,
        },
      },
    });
    syncToInterval();
  };

  useEffect(() => {
    if (account) {
      const getInfo = async () => {
        const provider = await connector.getProvider();
        let inBal = await getTokenBalance(
          provider,
          inToken["address"],
          account
        );
        let outBal = await getTokenBalance(
          provider,
          outToken["address"],
          account
        );
        setInBal(inBal);
        setOutBal(outBal);
        checkApproved(inToken, inValue);
        const swapFeePercent = await getSwapFeePercent(
          provider,
          poolList[selected_chain][0]["address"]
        );
        setSwapFee(swapFeePercent * 0.01);
      };
      getInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, ""]);

  useEffect(() => {
    getStatusData(inValue);
    const intervalId = setInterval(() => {
      getStatusData(inValue);
    }, 120000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inToken, outToken, inValue]);

  useEffect(() => {
    setFilterData(uniList[selected_chain]);
    selectToken(uniList[selected_chain][0], 0);
    selectToken(uniList[selected_chain][1], 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, selected_chain]);

  // Chart part
  useEffect(() => {
    if (formattedPricesData && formattedPricesData.length !== 0) {
      setNoChartData(false);
      loadChart();
    }
    else
      setNoChartData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedPricesData]);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <Grid
        container
        sx={{ maxWidth: "1220px" }}
        border={0}
        columnSpacing={{ xs: 0, sm: 0, md: 2, lg: 2 }}
      >
        <Grid item xs={12} sm={12} md={6} lg={4} >
          <Item
            elevation={1}
            style={{ backgroundColor: "transparent", color: darkFontColor, boxShadow: "0px 0px 0px 0px" }}
          >
            <Stack spacing={2} direction="row" className="swap_bh">
              <Button
                size="large"
                variant="contained"
                sx={{ width: 200, padding: 2, fontWeight: "bold" }}
                style={{
                  background:
                    "linear-gradient(to right bottom, #13a8ff, #0074f0)",
                }}
              >
                ON-CHAIN
              </Button>
              <Button
                size="large"
                variant="contained"
                sx={{
                  width: 200,
                  padding: 2,
                  fontWeight: "bold",

                  backgroundColor:
                    "#12122c"
                }}
              >
                CROSS CHAIN
              </Button>
            </Stack>
          </Item>
        </Grid>
        <Grid item xs={12} md={6} lg={8}>
          {/* <Item>xs=4</Item> */}
        </Grid>
        <Grid item xs={12} sm={12} md={5} sx={{ mt: 2 }} className="home__mainC">
          <Item sx={{ pl: 3, pr: 3, pb: 2 }} style={{ backgroundColor: "#12122c", borderRadius: "10px" }} className="home__main">
            <Typography
              variant="h5"
              sx={{ fontWeight: "600", color: "white" }}
              gutterBottom
              style={{ textAlign: "left", margin: "12px 0px" }}
            >
              Trade On-Chain
            </Typography>
            <FormControl
              sx={{ m: 0 }}
              style={{ alignItems: "flex-start", display: "inline" }}
              variant="standard"
            >
              <span
                style={{
                  color: "white",
                  fontWeight: "500",
                  fontSize: "16px",
                  display: "block",
                  textAlign: "left",
                }}
              >
                From
              </span>
              <div style={{ backgroundColor: "#12122c" }}>
                <Button
                  onClick={() => handleMopen(0)}
                  style={{ width: "40%", float: "left", border: "0px", padding: "9px 8px", fontSize: "13px", backgroundColor: "#07071c" }}
                  startIcon={
                    <img
                      src={inToken["logoURL"]}
                      alt=""
                      className="w-8"
                    />
                  }
                >
                  {inToken["symbol"]}
                </Button>
                <BootstrapInput
                  type="number"
                  value={inValue}
                  inputProps={{ min: 0, max: Number(inBal.toString().replaceAll(",", "")) }}
                  onChange={handleValue}
                  readOnly={!isExist || !account}
                  style={{
                    color: "#FFFFFF",
                    width: "60%",
                    float: "left",
                    borderLeft: "1px solid white",
                    borderRadius: "14px",
                  }}
                />
              </div>
              <div style={{ float: "left", width: "100%" }}>
                <span style={{ float: "left", color: grayColor }}>
                  Balance: {numFormat(inBal.toString().replaceAll(",", ""))}
                </span>

                <p style={{ float: "right", color: grayColor }}>
                  <span style={{ cursor: "pointer" }} onClick={() => setInLimit(4)}>25%</span>
                  <span style={{ paddingLeft: "5px", cursor: "pointer" }} onClick={() => setInLimit(2)}>50%</span>
                  <span style={{ paddingLeft: "5px", cursor: "pointer" }} onClick={() => setInLimit(1.3333)}>75%</span>
                  <span style={{ paddingLeft: "5px", cursor: "pointer" }} onClick={() => setInLimit(1)}>100%</span>
                </p>
              </div>
            </FormControl>
            <div>
              <ArrowCircleDownRounded
                onClick={reverseToken}
                sx={{ color: "white", fontSize: "32px", mt: 3, mb: 1 }}
              />
            </div>
            <FormControl
              sx={{ m: 0 }}
              style={{ alignItems: "flex-start", display: "inline" }}
              variant="standard"
            >
              <span
                style={{
                  color: "white",
                  fontWeight: "500",
                  fontSize: "16px",
                  display: "block",
                  textAlign: "left",
                }}
              >
                To
              </span>
              <div style={{ backgroundColor: "#12122c" }}>
                <Button
                  onClick={() => handleMopen(1)}
                  style={{ width: "40%", float: "left", border: "0px", padding: "9px 8px", fontSize: "13px", backgroundColor: "#07071c" }}
                  startIcon={
                    <img
                      src={outToken["logoURL"]}
                      alt=""
                      className="w-8"
                    />
                  }
                >
                  {outToken["symbol"]}
                </Button>
                <BootstrapInput
                  type="number"
                  value={valueEth}
                  readOnly={true}
                  style={{
                    color: "#FFFFFF",
                    width: "60%",
                    float: "left",
                    borderLeft: "1px solid white",
                    borderRadius: "14px",
                  }}
                />
              </div>
              <div style={{ float: "left", width: "100%" }}>
                <span style={{ float: "left", color: grayColor }}>
                  Balance: {numFormat(outBal.toString().replaceAll(",", ""))}
                </span>
              </div>
              <br />
            </FormControl>
            <div className="mt-10">
              {middleToken && middleToken.length === 2 && (
                <p className="text-light-primary" style={{ color: "white", fontWeight: "bold" }}>
                  {inToken.symbol} <ArrowForward style={{ fontSize: "18px" }} /> {middleTokenSymbol[0]} <ArrowForward style={{ fontSize: "18px" }} />{" "}
                  {middleTokenSymbol[1]} <ArrowForward style={{ fontSize: "18px" }} /> {outToken.symbol}
                </p>
              )}
              {middleToken && middleToken.length === 1 && (
                <p className="text-light-primary" style={{ color: "white", fontWeight: "bold" }}>
                  {inToken.symbol} <ArrowForward style={{ fontSize: "18px" }} /> {middleTokenSymbol[0]} <ArrowForward style={{ fontSize: "18px" }} />{" "}
                  {outToken.symbol}
                </p>
              )}
              {!middleToken && (
                <p className="text-light-primary" style={{ color: "white", fontWeight: "bold" }}>
                  {inToken.symbol} <ArrowForward style={{ fontSize: "18px" }} /> {outToken.symbol}
                </p>
              )}
            </div>
            {account && isExist &&
              <div style={{ color: "white", display: "block", textAlign: "left", margin: "10px 0px", float: "left", width: "100%" }}>
                <InfoOutlinedIcon
                  style={{
                    fontSize: "18px",
                  }}
                />{" "}
                1 {inToken["symbol"]} = {tokenPr} {outToken["symbol"]}
                <span onClick={() => setSetting(!setting)} style={{ color: "white", float: "right", cursor: "pointer" }}>
                  <Settings />
                </span>
              </div>
            }
            {(account && !isExist) &&
              <div style={{ color: "white", display: "block", textAlign: "left", margin: "10px 0px", float: "left", width: "100%" }}>
                <span style={{ color: "red" }}>No exchange rate available</span>
              </div>
            }
            {
              setting ? (
                <div>
                  <div className="s" style={{ float: "left", width: "100%" }}>
                    <span style={{ float: "left", color: grayColor }}>
                      Max Slippage:
                    </span>
                    <span style={{ float: "right", color: grayColor }}>
                      <span onClick={() => { setSlippage(0.1); }} style={{ color: slippage === 0.1 ? "lightblue" : "", cursor: "pointer" }}>0.1%</span>
                      <span onClick={() => { setSlippage(0.5); }} style={{ paddingLeft: "5px", color: slippage === 0.5 ? "lightblue" : "", cursor: "pointer" }}>0.5%</span>
                      <span onClick={() => { setSlippage(1); }} style={{ paddingLeft: "5px", color: slippage === 1 ? "lightblue" : "", cursor: "pointer" }}>1%</span>
                      <span onClick={() => { setSlippageFlag(!slippageFlag); }} style={{ paddingLeft: "5px", cursor: "pointer" }}>custom</span>
                    </span>
                    {slippageFlag && <Slider size="small" value={slippage} aria-label="Default" min={0.1} max={10} step={0.1} valueLabelDisplay="auto" getAriaValueText={valueLabelFormat} valueLabelFormat={valueLabelFormat} onChange={(e) => setSlippage(Number(e.target.value))} />}
                  </div>
                  <div style={{ marginTop: "10px", marginBottom: "10px", float: "left", width: "100%" }}>
                    <span style={{ float: "left", color: grayColor }}>
                      Time Deadline:
                    </span>
                    <span style={{ float: "right", color: grayColor }}>
                      <span onClick={() => { setDeadline(30); }} style={{ color: deadline === 30 ? "lightblue" : "", cursor: "pointer" }}>30sec</span>
                      <span onClick={() => { setDeadline(60); }} style={{ paddingLeft: "5px", color: deadline === 60 ? "lightblue" : "", cursor: "pointer" }}>1min</span>
                      <span onClick={() => { setDeadline(120); }} style={{ paddingLeft: "5px", color: deadline === 120 ? "lightblue" : "", cursor: "pointer" }}>2min</span>
                      <span onClick={() => { setDeadlineFlag(!deadlineFlag); }} style={{ paddingLeft: "5px", cursor: "pointer" }}>custom</span>
                    </span>
                    {deadlineFlag && <Slider size="small" value={deadline} aria-label="Default" min={10} max={900} step={2} valueLabelDisplay="auto" onChange={(e) => setDeadline(Number(e.target.value))} />}
                  </div>
                  <br />
                  <hr style={{ border: "1px solid #6d6d7d", marginTop: "10px" }} />
                  <br />
                </div>
              )
                :
                null
            }
            <div style={{ textAlign: "left" }}>
              <div>
                <span style={{ textAlign: "start", color: "white" }}>
                  Minimum Output after Slippage:
                </span>
                <div style={{ float: "right", display: "inline" }}>
                  <span style={{ textAlign: "right", color: "white" }}>{numFormat(valueEth * (1 - slippage * 0.01))}</span>
                </div>
              </div>
              <div>
                {account &&
                  <>
                    {isExist &&
                      <>
                        {(limitedout || Number(inValue) === 0) ? (
                          <Button
                            size="large"
                            variant="contained"
                            sx={{ width: "100%", padding: 2, fontWeight: "bold", mt: 2 }}
                            className="btn-disabled font-bold"
                            disabled={true}
                            style={{
                              textAlign: "center",
                              background:
                                "linear-gradient(to right bottom, #5e5c5c, #5f6a9d)",
                              color: "#ddd"
                            }}
                          >
                            {Number(inBal) <= 0 ? "Insufficient Balance" : "Input the token amount"}
                          </Button>
                        ) : (
                          approval ? (
                            <Button
                              size="large"
                              variant="contained"
                              sx={{ width: "100%", padding: 2, fontWeight: "bold", mt: 2 }}
                              onClick={executeSwap}
                              style={{
                                background: swapping ? "linear-gradient(to right bottom, #5e5c5c, #5f6a9d)" : "linear-gradient(to right bottom, #13a8ff, #0074f0)",
                                color: swapping ? "#ddd" : "#fff",
                                textAlign: "center",
                              }}
                              className={
                                swapping
                                  ? "btn-disabled font-bold w-full dark:text-black flex-1"
                                  : "btn-primary font-bold w-full dark:text-black flex-1"
                              }
                              disabled={swapping}
                            >
                              {swapping ? "Swap in progress" : "Swap Now"}
                            </Button>
                          ) : (
                            <>
                              <div className="flex">
                                <Button
                                  size="large"
                                  variant="contained"
                                  sx={{ width: "100%", padding: 2, fontWeight: "bold", mt: 2 }}
                                  onClick={() =>
                                    approveTk(Number(inValue - approval))
                                  }
                                  style={{
                                    background: (limitedout || unlocking) ? "linear-gradient(to right bottom, #5e5c5c, #5f6a9d)" : "linear-gradient(to right bottom, #13a8ff, #0074f0)",
                                    color: (limitedout || unlocking) ? "#ddd" : "#fff",
                                    textAlign: "center",
                                    marginRight: "8px"
                                  }}
                                  className={
                                    approval
                                      ? "btn-primary flex-1"
                                      : ((limitedout || unlocking) ? "flex-1" : "flex-1")
                                  }
                                  disabled={limitedout || unlocking}
                                >
                                  {unlocking ? "Unlocking..." : "Unlock " + Math.ceil(inValue - approvedVal) + " " + inToken["value"]}
                                </Button>
                                <Button
                                  size="large"
                                  variant="contained"
                                  sx={{ width: "100%", padding: 2, fontWeight: "bold", mt: 2 }}
                                  onClick={() => approveTk(9999999999)}
                                  style={{
                                    background: (limitedout || unlocking) ? "linear-gradient(to right bottom, #5e5c5c, #5f6a9d)" : "linear-gradient(to right bottom, #13a8ff, #0074f0)",
                                    color: (limitedout || unlocking) ? "#ddd" : "#fff",
                                    textAlign: "center",
                                    marginLeft: "8px"
                                  }}
                                  className={
                                    approval
                                      ? "flex-1"
                                      : ((limitedout || unlocking) ? "flex-1" : "flex-1")
                                  }
                                  disabled={limitedout || unlocking}
                                >
                                  {unlocking ? "Unlocking..." : "Infinite Unlock"}
                                </Button>
                              </div>
                              <div className="text-red-700 flex items-center pt-1.5">
                                <p className="text-small" style={{ color: "#b91c1c" }}>
                                  To proceed swapping, please unlock{" "}
                                  {inToken["value"].toUpperCase()} first.
                                </p>
                              </div>
                            </>
                          )
                        )
                        }
                      </>
                    }
                    {!isExist &&
                      <Button
                        size="large"
                        variant="contained"
                        sx={{ width: "100%", padding: 2, fontWeight: "bold", mt: 2 }}
                        className="btn-disabled font-bold"
                        disabled={true}
                        style={{
                          textAlign: "center",
                          background:
                            "linear-gradient(to right bottom, #5e5c5c, #5f6a9d)",
                          color: "#ddd"
                        }}
                      >
                        No router
                      </Button>
                    }
                  </>
                }
                {!account && (
                  <Button
                    size={isMobile ? "small" : "large"}
                    variant="contained"
                    sx={{ width: "100%", padding: 2, fontWeight: "bold", mt: 2 }}
                    onClick={clickConWallet}
                    style={{
                      background: "linear-gradient(to right bottom, #13a8ff, #0074f0)",
                      color: "#fff",
                      textAlign: "center",
                      marginRight: "8px",
                      maxHeight: 57
                    }}
                    className="btn-primary font-bold w-full dark:text-black flex-1"
                  >
                    {"Connect to Wallet"}
                  </Button>
                )}
              </div>
            </div>
          </Item>
        </Grid>
        <Grid item xs={12} sm={12} md={7} sx={{ mt: 2 }} className="chart__main">
          <Item sx={{ pt: 3, pl: 3, pr: 3, pb: 2, mb: 2 }} style={{ backgroundColor: "#12122c", borderRadius: "10px" }} className="chart">
            {!isExist &&
              <div style={{ minHeight: "374px", textAlign: "center" }}>
                <p style={{ color: "white", fontSize: "18px", paddingTop: 160 }}>No price chart available!</p>
              </div>
            }

            {(isExist && noChartData) &&
              <div style={{ minHeight: "374px", textAlign: "center" }}>
                <p style={{ color: "white", fontSize: "18px", paddingTop: 160 }}>No chart data available</p>
              </div>
            }
            <div style={{ display: (noChartData || !isExist) ? "none" : "block" }}>
              <p style={{ color: "white", fontSize: "15px", fontWeight: "bold", float: "left" }}>{inToken["symbol"]} / {outToken["symbol"]}</p>
              <div ref={chartRef} className="w-full" />
            </div>
            {/* <div ref={switchRef} /> */}
          </Item>
          {account &&
            <Item sx={{ pl: 3, pr: 3, pb: 2, pt: 3 }} style={{ backgroundColor: "#12122c", textAlign: "left", borderRadius: "10px" }} className="history">
              <span style={{ textAlign: "start", color: "white" }}>History:</span>
              <hr></hr>
              <History type="swap" data={transactionsData} />
            </Item>
          }
        </Grid>
        <Modal
          open={mopen}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <StyledModal className="bg-modal">
            <h3 className="model-title mb-6 text-wight" style={{ color: "#fff" }}>Select Token</h3>
            <TextField
              autoFocus={true}
              value={query}
              onChange={filterToken}
              label="Search"
              inputProps={{
                type: "search",
                style: { color: "#ddd" },
              }}
              InputLabelProps={{
                style: { color: "#ddd" },
              }}
            />
            <hr className="my-6" />
            <ul className="flex flex-col gap-y-2" style={{ overflowY: "scroll" }}>
              {filterData.map((item) => {
                const { address, logoURL, symbol } = item;
                return (
                  <li
                    key={address}
                    className="flex gap-x-1 thelist"
                    style={{ cursor: "pointer", padding: "5px" }}
                    onClick={() => selectToken(item, selected)}
                  >
                    <div className="relative flex">
                      <img src={logoURL} alt="" />
                    </div>
                    <p className="text-light-primary text-lg">{symbol}</p>
                  </li>
                );
              })}
            </ul>
          </StyledModal>
        </Modal>
      </Grid>
    </div>
  );
}

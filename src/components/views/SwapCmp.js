import { Button, Grid, Stack, Paper, styled, Hidden, useMediaQuery } from '@mui/material'
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom';
import "./Navigation.css"

function SwapCmp() {
  const darkFontColor = "#FFF";
  const [activeSwapColor, setActiveSwapColor] = useState("linear-gradient(to right bottom, #13a8ff, #0074f0)");

  const isMobile = useMediaQuery("(max-width:600px)");

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
  }));

  const location = useLocation();
  return (
    <>
      <Hidden smDown={true}>
        <Grid item xs={12} sm={12} md={9} lg={8} >
          <Item
            elevation={1}
            style={{ backgroundColor: "transparent", color: darkFontColor }}
          >
            <Stack spacing={2} direction="row">
              <Link to="/add_liquidity" style={{ textDecoration: "none" }}>
                <Button
                  size="large"
                  variant="contained"
                  sx={{
                    width:200,
                    padding: 2,
                    fontWeight: "bold",
                    background:
                      location.pathname === "/add_liquidity" ? activeSwapColor : "#12122c",
                  }}
                  onClick={() => setActiveSwapColor("/add_liquidity")}
                >
                  Add Liquidity
                </Button>
              </Link>
              <Link to="/remove_liquidity" style={{ textDecoration: "none" }}>
                <Button
                  size="large"
                  variant="contained"
                  sx={{
                    width:200,
                    padding: 2,
                    fontWeight: "bold",
                    background:
                      location.pathname === "/remove_liquidity" ? activeSwapColor : "#12122c",
                  }}
                  onClick={() => setActiveSwapColor("/remove_liquidity")}
                >
                  REMOVE LIQUIDITY
                </Button>
              </Link>

              <Link to="/create_liquidity" style={{ textDecoration: "none" }}>
                <Button
                  size="large"
                  variant="contained"
                  sx={{
                    width:200,
                    padding: 2,
                    fontWeight: "bold",
                    background:
                      location.pathname === "/create_liquidity" ? activeSwapColor : "#12122c",
                  }}
                  onClick={() => setActiveSwapColor("/create_liquidity")}
                >
                  Pool Factory
                </Button>
              </Link>


            </Stack>
          </Item>
        </Grid>

      </Hidden>

      <Hidden smUp={true}>
        <Grid sx={{ overflowX: 'scroll' }} item xs={12} sm={12} md={9} lg={8} >
          <Item
            elevation={1}

            style={{ backgroundColor: "transparent", color: darkFontColor }} className="swap_b"
          >
            <Stack spacing={2} className="swap_b" style={{flexDirection:isMobile ? "column" : "row"}} >
              <Link to="/add_liquidity" style={{ textDecoration: "none", marginLeft:isMobile ? "0px" : "auto", marginBottom: isMobile?"4px":"0px" }}>
                <Button
                  size={isMobile ? "small" : "large"}
                  variant="contained"
                  sx={{
                    width:200,
                    padding: 2,
                    fontWeight: "bold",
                    background:
                      location.pathname === "/add_liquidity" ? activeSwapColor : "#12122c",
                  }}
                  onClick={() => setActiveSwapColor("/add_liquidity")}
                >
                  Add Liquidity
                </Button>
              </Link>
              <Link to="/remove_liquidity" style={{ textDecoration: "none", marginLeft:isMobile ? "0px" : "auto", marginBottom: isMobile?"4px":"0px" }}>
                <Button
                  size={isMobile ? "small" : "large"}
                  variant="contained"
                  sx={{
                    width:200,
                    padding: 2,
                    fontWeight: "bold",
                    background:
                      location.pathname === "/remove_liquidity" ? activeSwapColor : "#12122c",
                  }}
                  onClick={() => setActiveSwapColor("/remove_liquidity")}
                >
                  REMOVE LIQUIDITY
                </Button>
              </Link>

              <Link to="/create_liquidity" style={{ textDecoration: "none", marginLeft:isMobile ? "0px" : "auto", marginBottom: isMobile?"4px":"0px" }}>
                <Button
                  size={isMobile ? "small" : "large"}
                  variant="contained"
                  sx={{
                    width:200,
                    padding: 2,
                    fontWeight: "bold",
                    background:
                      location.pathname === "/create_liquidity" ? activeSwapColor : "#12122c",
                  }}
                  onClick={() => setActiveSwapColor("/create_liquidity")}
                >
                  Pool Factory
                </Button>
              </Link>


            </Stack>
          </Item>
        </Grid>
      </Hidden>

      <Grid item xs={12} md={3} lg={4}>
        {/* <Item>xs=4</Item> */}
      </Grid>

    </>
  )
}

export default SwapCmp

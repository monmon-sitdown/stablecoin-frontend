import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Button, TextField, Typography, Container, Paper } from "@mui/material";
import CollateralManagerABI from "./abi/CollateralManagerABI.json";
import SimpleStableCoinABI from "./abi/SimpleStableCoinABI.json";

const CollateralManagerApp = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [cmContract, setCmContract] = useState(null);
  const [sscContract, setSscContract] = useState(null);
  const [account, setAccount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [sscAmountToMint, setSscAmountToMint] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
  const [sscAmountToBurn, setSscAmountToBurn] = useState("");
  const [debtToCover, setDebtToCover] = useState("");
  const [loading, setLoading] = useState(false);
  const tokenABI = [
    // Some details about the token
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",

    // Get the account balance
    "function balanceOf(address owner) view returns (uint256)",

    // Transfer balance to another account
    "function transfer(address to, uint256 amount)",

    // Approve another address to spend tokens
    "function approve(address spender, uint256 amount)",

    // Get the current allowance for a spender
    "function allowance(address owner, address spender) view returns (uint256)",

    // Transfer approved balance from one account to another
    "function transferFrom(address from, address to, uint256 amount)",

    "function mint(address to, uint256 amount) public",

    // Event emitted when tokens are transferred
    "event Transfer(address indexed from, address indexed to, uint256 value)",

    // Event emitted when the approval amount is updated
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
  ];

  const [collateralBalance, setCollateralBalance] = useState("0");
  const [collateralBalanceUSD, setCollateralBalanceUSD] = useState("0");
  const [sscBalance, setSscBalance] = useState("0");
  const [healthFactor, sethealthFactor] = useState("1");
  const tokenAddress = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570"; //wethMockAddress

  // Get Account Information
  const getAccountInfo = async (cmContract, userAddress) => {
    try {
      // Get Collateral information（ETH）
      const collateralBalance = await cmContract.getAccountCollateralValueETH(
        userAddress,
        tokenAddress
      );

      setCollateralBalance(ethers.utils.formatEther(collateralBalance));

      // Get Collateral in USD
      const collateralBalanceUSD =
        await cmContract.getAccountCollateralValueUSD(
          userAddress,
          tokenAddress
        );
      setCollateralBalanceUSD(ethers.utils.formatEther(collateralBalanceUSD));

      // get SSC amount
      const sscBalance = await cmContract.getAccountMintedSSC(userAddress);
      setSscBalance(ethers.utils.formatEther(sscBalance));

      const healthFactor = await cmContract.calculateHealthFactor(
        userAddress,
        tokenAddress
      );
      sethealthFactor(ethers.utils.formatEther(healthFactor));
    } catch (error) {
      console.error("Error fetching account info:", error);
    }
  };

  const handleRefresh = async () => {
    try {
      // refresh information
      await getAccountInfo(cmContract, account);
    } catch (error) {
      console.error("Error during fetching account info:", error);
    }
  };

  // Set up provider and contracts
  useEffect(() => {
    const init = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const account = await signer.getAddress();
      //console.log("User address:", account);
      const deployedCollateralManagerAddress =
        "0x4c5859f0F772848b2D91F1D83E2Fe57935348029";
      const sscAddress = "0x809d550fca64d94Bd9F66E60752A544199cfAC3D";

      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      setCmContract(
        new ethers.Contract(
          deployedCollateralManagerAddress,
          CollateralManagerABI,
          signer
        )
      );

      try {
        const cm = new ethers.Contract(
          deployedCollateralManagerAddress, // Address of deployed contract
          CollateralManagerABI,
          signer
        );

        setCmContract(cm); // Update state with the contract instance
      } catch (error) {
        console.error("Error initializing contract:", error);
      }

      const ssc = setSscContract(
        new ethers.Contract(sscAddress, SimpleStableCoinABI, signer)
      );

      setSscContract(ssc);

      //await getAccountInfo(cm, account);
    };
    init();
  }, []);

  useEffect(() => {
    if (cmContract) {
      // test cmContract
      getAccountInfo(cmContract, account);
    }
  }, [cmContract, account]); // monitor if  cmContract changed

  const handleApprove = async () => {
    /*
    try { //for anvil debugging, since the tx jam, have to send empty tx to add block number for letting jammed block confirmed
      setLoading(true);
      const tx = {
        from: account,
        to: account,
        value: ethers.utils.parseEther("0"),
        nonce: await provider.getTransactionCount(account, "latest"),
        gasPrice: await provider.getGasPrice(),
        gasLimit: ethers.utils.hexlify(21000),
      };
      // 发送一个无效交易（覆盖之前的交易）
      await signer.sendTransaction(tx);
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setLoading(false);
    }*/

    try {
      setLoading(true);
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
      const amountToMint = ethers.utils.parseEther("1000");

      const txMint = await tokenContract.mint(account, amountToMint);
      await txMint.wait();
      console.log("Minting successful");

      const tx = await tokenContract.approve(
        cmContract.address,
        amountToMint // Approve 1000 ETH (or token)
      );

      await tx.wait(); // Wait for transaction confirmation
      console.log("Approval successful");
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    // Your deposit function here
    try {
      await cmContract.depositCollateral(
        tokenAddress,
        ethers.utils.parseEther(collateralAmount),
        {
          gasLimit: ethers.utils.hexlify(100000), // set gas limit because of errors
        }
      );
      console.log("Deposit successful");
      await getAccountInfo(cmContract, account);
    } catch (error) {
      console.error("Error during deposit:", error);
    }
  };

  const handleMintSSC = async () => {
    //await cmContract.mintSsc(ethers.utils.parseEther(sscAmountToMint));
    //await getAccountInfo(cmContract, account);

    const gasLimit = ethers.BigNumber.from("1000000"); // 设置一个较高的 gasLimit
    try {
      const tx = await cmContract.mintSsc(
        ethers.utils.parseEther(sscAmountToMint),
        {
          gasLimit,
        }
      );
      await tx.wait(); // Wait for finishing transacation
      await getAccountInfo(cmContract, account);
    } catch (error) {
      console.error("Error during mint:", error);
      parseRevertError(error);
    }
  };

  const parseRevertError = (error) => {
    if (error.data) {
      try {
        // 定义自定义错误的 ABI
        const iface = new ethers.utils.Interface([
          "error CM__BreakHealthFactor()",
        ]);

        // 解析错误数据
        const decodedError = iface.parseError(error.data);
        console.error("Custom Error Decoded:", decodedError);
        alert("Transaction failed: CM__BreakHealthFactor triggered.");
      } catch (parseError) {
        console.error("Failed to parse custom error:", parseError);
      }
    } else {
      console.error("Unknown error:", error);
      alert("An unknown error occurred.");
    }
  };

  const handleRedeem = async () => {
    // Your redeem function here
    await cmContract.redeemCollateral(
      tokenAddress,
      ethers.utils.parseEther(redeemAmount),
      ethers.utils.parseEther(sscAmountToBurn)
    );
    await getAccountInfo(cmContract, account);
  };

  const handleLiquidate = async () => {
    // Your liquidate function here
    await cmContract.liquidate(
      tokenAddress,
      account,
      ethers.utils.parseEther(debtToCover)
    );
    await getAccountInfo(cmContract, account);
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "20px" }}>
      <div>
        <Button
          variant="contained"
          color="primary"
          onClick={handleApprove}
          disabled={loading} // Disable button while loading
        >
          {loading ? "Approving..." : "Approve 1000 ETH"}
        </Button>
      </div>
      <div>
        <h3>Collateral Balance: {collateralBalance} ETH</h3>
        <h3>Collateral Balance in USD: ${collateralBalanceUSD}</h3>
        <h3>SSC Balance: {sscBalance} SSC</h3>
        <h3>Health Factor: {healthFactor} </h3>
        <Button variant="contained" color="primary" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      <Typography variant="h4" gutterBottom>
        Collateral Manager
      </Typography>
      <Paper style={{ padding: "20px" }}>
        <Typography variant="h6">Deposit Collateral</Typography>
        <TextField
          label="Collateral Amount"
          value={collateralAmount}
          onChange={(e) => setCollateralAmount(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleDeposit}>
          Deposit
        </Button>
      </Paper>
      <Paper style={{ padding: "20px", marginTop: "20px" }}>
        <Typography variant="h6">Mint SSC</Typography>
        <TextField
          label="Amount to Mint"
          value={sscAmountToMint}
          onChange={(e) => setSscAmountToMint(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleMintSSC}>
          Mint SSC
        </Button>
      </Paper>
      <Paper style={{ padding: "20px", marginTop: "20px" }}>
        <Typography variant="h6">Redeem Collateral</Typography>
        <TextField
          label="SSC Amount to Burn"
          value={sscAmountToBurn}
          onChange={(e) => setSscAmountToBurn(e.target.value)}
          disabled={true}
        />
        <Button variant="contained" color="primary" onClick={handleRedeem}>
          Redeem
        </Button>
      </Paper>
      <Paper style={{ padding: "20px", marginTop: "20px" }}>
        <Typography variant="h6">Liquidate</Typography>
        <TextField
          label="Debt to Cover"
          value={debtToCover}
          onChange={(e) => setDebtToCover(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleLiquidate}>
          Liquidate
        </Button>
      </Paper>
    </Container>
  );
};

export default CollateralManagerApp;

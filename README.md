# CollateralManagerApp

## Overview

The `CollateralManagerApp` is a React component that interacts with a collateral management system on the Ethereum blockchain. It allows users to deposit collateral, mint Simple Stable Coins (SSC), redeem collateral, and liquidate accounts. The component utilizes the `ethers.js` library for blockchain interactions and Material-UI for user interface elements.

## Features

- Connects to the user's Ethereum wallet using MetaMask.
- Retrieves and displays user account information, including collateral balance in ETH and USD, and SSC balance.
- Allows users to approve collateral for the `CollateralManager` contract.
- Enables users to deposit collateral into the contract.
- Facilitates minting of SSC based on the collateral deposited.
- Supports redeeming collateral and liquidating accounts when necessary.

## Functions

### getAccountInfo

```javascript
const getAccountInfo = async (cmContract, userAddress) => {...}
```

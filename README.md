# Jazz Coin

Jazz Coin is an ERC-20 compliant smart contract deployed to Ethereum. This project tests, deploys, and verifies the code for JazzERC20.

Web UI coming soon.

```
Test: npm test
Deploy to Sepolia: npx hardhat ignition/modules/JazzERC20.js --network sepolia
Verify on Sepolia: npx hardhat verify --network sepolia <smart contract address> --constructor-args verify/JazzERC20.arguments.js
```

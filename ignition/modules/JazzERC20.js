const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const settings = require("../../settings.json");

module.exports = buildModule("JazzERC20", (m) => {
  const jazzErc20 = m.contract("JazzERC20", [settings.JazzERC20.name, settings.JazzERC20.symbol, settings.JazzERC20.decimals, settings.JazzERC20.initialSupply]);

  return { jazzErc20 };
});
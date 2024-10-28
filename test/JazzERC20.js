const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const settings = require("../settings.json");

describe("JAZZ ERC-20 smart contract", () => {
  async function deployTokenFixture() {
    const name = settings.JazzERC20.name;
    const symbol = settings.JazzERC20.symbol;
    const decimals = settings.JazzERC20.decimals;
    const totalSupply = settings.JazzERC20.initialSupply;

    const [minter, alice, bob, eve] = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory("JazzERC20")
    const contract = await contractFactory.deploy(name, symbol, decimals, totalSupply)

    return { jazzErc20: contract, minter, alice, bob, eve };
  }

  describe("Deployment", function () {
    it("Sets the token name", async () => {
      const { jazzErc20: contract } = await loadFixture(deployTokenFixture);

      expect(await contract.name()).to.equal(settings.JazzERC20.name);
    });

    it("Sets the token symbol", async () => {
      const { jazzErc20: contract } = await loadFixture(deployTokenFixture);

      expect(await contract.symbol()).to.equal(settings.JazzERC20.symbol);
    });

    it("Sets the token number of decimals", async () => {
      const { jazzErc20: contract } = await loadFixture(deployTokenFixture);

      expect(await contract.decimals()).to.equal(settings.JazzERC20.decimals);
    });

    it("Sets the token total supply", async () => {
      const { jazzErc20: contract } = await loadFixture(deployTokenFixture);

      expect(await contract.totalSupply()).to.equal(settings.JazzERC20.initialSupply);
    });

    it("Issues total supply to the minter", async () => {
      const { jazzErc20: contract, minter } = await loadFixture(deployTokenFixture);

      expect(await contract.balanceOf(minter)).to.equal(await contract.totalSupply());
    });
  });

  describe("Transfers", () => {
    it("Emits a Transfer event when transfer() is called", async () => {
      const { jazzErc20: contract, minter, alice } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await expect(contract.transfer(alice, amount)).to.emit(contract, "Transfer").withArgs(minter, alice, amount);
    });

    it("Adjusts balances when a transfer occurs", async () => {
      const { jazzErc20: contract, minter, alice } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.transfer(alice, amount);
      expect(await contract.balanceOf(alice)).to.equal(amount);
      expect(await contract.balanceOf(minter)).to.equal(settings.JazzERC20.initialSupply - amount);
    });

    context("Alice has 2000 doinks and Bob has 1000 doinks", () => {
      const contextTokenFixture = async () => {
        const { jazzErc20: contract, minter, alice, bob, eve } = await loadFixture(deployTokenFixture);

        await contract.transfer(alice, 2000);
        await contract.transfer(bob, 1000);

        return { jazzErc20: contract, minter, alice, bob, eve };
      };

      it("Alice should be able to transfer 2000 doinks to Bob", async () => {
        const { jazzErc20: contract, alice, bob } = await loadFixture(contextTokenFixture);

        const amount = BigInt(2000);
        aliceBalance = await contract.balanceOf(alice);
        bobBalance = await contract.balanceOf(bob);
        await contract.connect(alice).transfer(bob, amount);
        expect(await contract.balanceOf(alice)).to.equal(aliceBalance - amount);
        expect(await contract.balanceOf(bob)).to.equal(bobBalance + amount);
      });

      it("Bob should not be able to transfer 2000 doinks to Alice", async () => {
        const { jazzErc20: contract, alice, bob } = await loadFixture(contextTokenFixture);

        const amount = 2000;
        aliceBalance = await contract.balanceOf(alice);
        bobBalance = await contract.balanceOf(bob);
        await expect(contract.connect(bob).transfer(alice, amount)).to.be.revertedWith("Your balance is too low.");
        expect(await contract.balanceOf(alice)).to.equal(aliceBalance);
        expect(await contract.balanceOf(bob)).to.equal(bobBalance);
      });
    });
  });

  describe("Allowances", () => {
    it("Emits an Approval event when approve() is called", async () => {
      const { jazzErc20: contract, alice, bob } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await expect(contract.connect(alice).approve(bob, amount)).to.emit(contract, "Approval").withArgs(alice, bob, amount)
    });

    it("Adjusts allowance when an approval occurs", async () => {
      const { jazzErc20: contract, alice, bob } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.connect(alice).approve(bob, amount);
      expect(await contract.allowance(alice, bob)).to.equal(amount);
    });

    it("Emits a Transfer event when transferFrom() is called", async () => {
      const { jazzErc20: contract, alice, bob, eve } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.transfer(alice, amount);
      await contract.connect(alice).approve(bob, amount);
      await expect(contract.connect(bob).transferFrom(alice, eve, amount)).to.emit(contract, "Transfer").withArgs(alice, eve, amount);
    });

    it("Adjusts allowance when an approved transfer occurs", async () => {
      const { jazzErc20: contract, alice, bob, eve } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.transfer(alice, amount);
      await contract.connect(alice).approve(bob, amount);
      await contract.connect(bob).transferFrom(alice, eve, amount);
      expect(await contract.allowance(alice, bob)).to.equal(0);
    });

    context("Alice has 2000 doinks and has given Bob a 1000 doink allowance", () => {
      const contextTokenFixture = async () => {
        const { jazzErc20: contract, minter, alice, bob, eve } = await loadFixture(deployTokenFixture);

        await contract.transfer(alice, 2000);
        await contract.connect(alice).approve(bob, 1000);

        return { jazzErc20: contract, minter, alice, bob, eve };
      };

      it("Bob should be able to transfer 1000 doinks from Alice to Eve", async () => {
        const { jazzErc20: contract, alice, bob, eve } = await loadFixture(contextTokenFixture);

        const amount = BigInt(1000);
        const balance = await contract.balanceOf(alice);
        const allowance = await contract.allowance(alice, bob);
        await contract.connect(bob).transferFrom(alice, eve, amount);
        expect(await contract.balanceOf(alice)).to.equal(balance - amount);
        expect(await contract.balanceOf(eve)).to.equal(amount);
        expect(await contract.allowance(alice, bob)).to.equal(allowance - amount);
      });

      it("Bob should not be able to transfer 2000 doinks from Alice to Eve", async () => {
        const { jazzErc20: contract, alice, bob, eve } = await loadFixture(contextTokenFixture);

        const amount = BigInt(2000);
        const balance = await contract.balanceOf(alice);
        const allowance = await contract.allowance(alice, bob);
        await expect(contract.connect(bob).transferFrom(alice, eve, amount)).to.be.revertedWith("You are not approved to transfer these doinks.");
        expect(await contract.balanceOf(alice)).to.equal(balance);
        expect(await contract.balanceOf(eve)).to.equal(0);
        expect(await contract.allowance(alice, bob)).to.equal(allowance);
      });
    });

    context("Alice has 1000 doinks and has given Bob a 2000 doink allowance", () => {
      const contextTokenFixture = async () => {
        const { jazzErc20: contract, minter, alice, bob, eve } = await loadFixture(deployTokenFixture);

        await contract.transfer(alice, 1000);
        await contract.connect(alice).approve(bob, 2000);

        return { jazzErc20: contract, minter, alice, bob, eve };
      };

      it("Bob should be able to transfer 1000 doinks from Alice to Eve", async () => {
        const { jazzErc20: contract, alice, bob, eve } = await loadFixture(contextTokenFixture);

        const amount = BigInt(1000);
        const balance = await contract.balanceOf(alice);
        const allowance = await contract.allowance(alice, bob);
        await contract.connect(bob).transferFrom(alice, eve, amount);
        expect(await contract.balanceOf(alice)).to.equal(balance - amount);
        expect(await contract.balanceOf(eve)).to.equal(amount);
        expect(await contract.allowance(alice, bob)).to.equal(allowance - amount);
      });

      it("Bob should not be able to transfer 2000 doinks from Alice to Eve", async () => {
        const { jazzErc20: contract, alice, bob, eve } = await loadFixture(contextTokenFixture);

        const amount = BigInt(2000);
        const balance = await contract.balanceOf(alice);
        const allowance = await contract.allowance(alice, bob);
        await expect(contract.connect(bob).transferFrom(alice, eve, amount)).to.be.revertedWith("Sender balance is too low.");
        expect(await contract.balanceOf(alice)).to.equal(balance);
        expect(await contract.balanceOf(eve)).to.equal(0);
        expect(await contract.allowance(alice, bob)).to.equal(allowance);
      });
    });
  });

  describe("Supply", () => {
    it("Emits a Transfer event when mint() is called", async () => {
      const { jazzErc20: contract, alice } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await expect(contract.mint(alice, amount)).to.emit(contract, "Transfer").withArgs(ethers.ZeroAddress, alice, amount);
    });

    it("Increases balance when minting tokens", async () => {
      const { jazzErc20: contract, alice } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.mint(alice, amount);
      expect(await contract.balanceOf(alice)).to.equal(amount);
    });

    it("Increases total supply when minting tokens", async () => {
      const { jazzErc20: contract, alice } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.mint(alice, amount);
      expect(await contract.totalSupply()).to.equal(settings.JazzERC20.initialSupply + amount);
    });

    it("Emits a Transfer event when burn() is called", async () => {
      const { jazzErc20: contract, alice } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.transfer(alice, amount);
      await expect(contract.burn(alice, amount)).to.emit(contract, "Transfer").withArgs(alice, ethers.ZeroAddress, amount);
    });

    it("Decreases balance when burning tokens", async () => {
      const { jazzErc20: contract, alice } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.transfer(alice, amount);
      await contract.burn(alice, amount);
      expect(await contract.balanceOf(alice)).to.equal(0);
    });

    it("Decreases total supply when burning tokens", async () => {
      const { jazzErc20: contract, alice } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.transfer(alice, amount);
      await contract.burn(alice, amount);
      expect(await contract.totalSupply()).to.equal(settings.JazzERC20.initialSupply - amount);
    });
  });

  describe("Roles", () => {
    it("Emits a RoleUpdate event when setRole() is called", async () => {
      const { jazzErc20: contract, alice } = await loadFixture(deployTokenFixture);

      await expect(contract.setRole(alice, true)).to.emit(contract, "RoleUpdate").withArgs(alice, true);
    });

    it("Limits privileged operations to admins only", async () => {
      const { jazzErc20: contract, alice } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.transfer(alice, amount);
      await expect(contract.connect(alice).mint(alice, amount)).to.revertedWith("Only an admin may create tokens.");
      await expect(contract.connect(alice).burn(alice, amount)).to.revertedWith("Only an admin may destroy tokens.");
      await expect(contract.connect(alice).setRole(alice, true)).to.revertedWith("Only an admin may set roles.");
    });

    it("Should promote an account to admin", async () => {
      const { jazzErc20: contract, alice, bob } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.setRole(alice, true);
      await expect(contract.connect(alice).mint(alice, amount)).to.emit(contract, "Transfer").withArgs(ethers.ZeroAddress, alice, amount);
      await expect(contract.connect(alice).burn(alice, amount)).to.emit(contract, "Transfer").withArgs(alice, ethers.ZeroAddress, amount);
      await expect(contract.connect(alice).setRole(bob, true)).to.emit(contract, "RoleUpdate").withArgs(bob, true);
    });

    it("Should demote an account from admin", async () => {
      const { jazzErc20: contract, minter, alice } = await loadFixture(deployTokenFixture);

      const amount = 1000;
      await contract.setRole(alice, true);
      await contract.connect(alice).setRole(minter, false);
      await expect(contract.mint(alice, amount)).to.revertedWith("Only an admin may create tokens.");
      await expect(contract.burn(alice, amount)).to.revertedWith("Only an admin may destroy tokens.");
      await expect(contract.setRole(alice, false)).to.revertedWith("Only an admin may set roles.");
    });
  });
});

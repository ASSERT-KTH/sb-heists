const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const path = require("path");
const fs = require("fs");

describe("attack access_control/parity_wallet_bug_2.sol", function () {
  let owner;
  async function deployContracts() {
    [owner] = await ethers.getSigners();
    const codePath = path.join(
      __dirname,
      "../../artifacts/contracts/dataset/access_control/parity_wallet_bug_2.sol/WalletLibrary.json",
    );
    const json = JSON.parse(fs.readFileSync(codePath));
    const WalletLibrary = await ethers.getContractFactory(
      json.abi,
      json.bytecode,
    );
    const victim = await WalletLibrary.connect(owner).deploy();
    await victim.waitForDeployment();
    const address = await victim.getAddress();

    const WalletLibraryAttacker = await ethers.getContractFactory(
      "contracts/access_control/parity_wallet_bug_2_attack.sol:WalletLibraryAttacker",
    );
    const attacker = await WalletLibraryAttacker.deploy(address);
    await attacker.waitForDeployment();
    return { victim, attacker };
  }

  it("functional check: access_control/parity_wallet_bug_2.sol", async function () {
    const { victim } = await loadFixture(deployContracts);
    const [v, a] = await ethers.getSigners();
    await expect(victim.connect(owner).initWallet([owner.address], 1, 1)).to.not
      .be.reverted;
    const amount = ethers.parseEther("1");
    await a.sendTransaction({
      to: victim.target,
      value: amount,
    });
    expect(await ethers.provider.getBalance(victim.target)).to.equal(amount);
    const balanceBefore = await ethers.provider.getBalance(owner.address);
    const tx = await victim.connect(owner).kill(owner.address);
    const receipt = await tx.wait();
    const gasFee = receipt.gasUsed * receipt.gasPrice;
    expect(await ethers.provider.getBalance(owner.address)).to.equal(
      balanceBefore - gasFee + amount,
    );
  });

  it("exploit access control vulnerability", async function () {
    const { victim, attacker } = await loadFixture(deployContracts);
    const amount = ethers.parseEther("1");
    const [signer] = await ethers.getSigners();
    await signer.sendTransaction({
      to: victim.target,
      value: amount,
    });

    const victimBalanceBefore = await ethers.provider.getBalance(victim.target);
    expect(victimBalanceBefore).to.equal(amount);

    const attackerBalanceBefore = await ethers.provider.getBalance(
      attacker.target,
    );
    expect(attackerBalanceBefore).to.equal(0);

    await attacker.attack();
    const victimBalanceAfter = await ethers.provider.getBalance(victim.target);
    expect(victimBalanceAfter).to.equal(0);

    const attackerBalanceAfter = await ethers.provider.getBalance(
      attacker.target,
    );
    expect(attackerBalanceAfter).to.equal(amount);
  });
});

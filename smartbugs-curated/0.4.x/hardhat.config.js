require("@nomicfoundation/hardhat-toolbox");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.4.24",
      },
      {
        version: "0.4.25",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.5.0",
      },
    ],
  },
  networks: {
    hardhat: {
      initialDate: "2018-12-31 11:59:00 PM",
      hardfork: "shanghai",
    }
  },
  mocha: {
    reporter: './scripts/CustomReporter.js',
    reporterOptions: {
      json: false, // Export test results to JSON
    }
  },
};

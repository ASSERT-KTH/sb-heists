const Mocha = require("mocha");
const fs = require("fs");
const path = require("path");
const { fail } = require("assert");

// Extend the Spec reporter
const Spec = Mocha.reporters.Spec;
const Base = Mocha.reporters.Base; // For styling and symbols

const suffix = "";
class CustomReporter extends Spec {
  constructor(runner, options) {
    // Call the parent constructor (Spec reporter)
    super(runner);

    // Initialize variables to track the current file and passing file count
    let passingFiles = 0;
    let currentFile = null;
    let allTestsPassed = true;
    let allFiles = 0;
    let failedFunctionalCheck = 0;
    const failedFunctionalChecks = [];
    let passedFunctionalCheck = 0;
    const passedResults = [];
    const failedResults = [];

    const exportOptions = options.reporterOptions || {};
    const exportToJson = exportOptions.json || false;

    // When a new suite (test file) starts
    runner.on("suite", (suite) => {
      if (suite.file) {
        if (currentFile !== suite.file) {
          // New test file started
          currentFile = suite.file;
          allTestsPassed = true; // Assume all tests will pass initially
          allFiles += 1;
        }
      }
    });

    // If any test fails
    runner.on("fail", (test, err) => {
      // Mark the current test file as having failed tests
      allTestsPassed = false;
      const fileName = currentFile.split("/test/")[1];
      const contractFile = fileName.replace("_test.js", suffix + ".sol");
      const result = {
        title: test.title,
        file: fileName,
        contractFile: contractFile,
        state: test.state,
        error: err.message,
        stack: err.stack,
      };
      if (test.title.includes("functional check")) {
        failedFunctionalCheck += 1;
        failedFunctionalChecks.push(result);
      } else {
        failedResults.push(result);
      }
    });

    // If any test passes
    runner.on("pass", (test) => {
      const fileName = currentFile.split("/test/")[1];
      const contractFile = fileName.replace("_test.js", suffix + ".sol");
      const result = {
        title: test.title,
        file: fileName,
        contractFile: contractFile,
        state: test.state,
      };
      if (test.title.includes("functional check")) {
        passedFunctionalCheck += 1;
      } else {
        passedResults.push(result);
      }
    });

    // When the suite (test file) ends
    runner.on("suite end", (suite) => {
      if (suite.file && currentFile === suite.file && allTestsPassed) {
        passingFiles += 1;
      }
    });

    // At the end of all tests, log the number of passing test files in the same style as passing tests
    runner.on("end", () => {
      const { tests, passes, failures, pending, duration } = runner.stats;

      const failedFiles = allFiles - passingFiles;

      const formattedMessage = Base.color(
        "green",
        `Total passing test files: ${passingFiles}/${allFiles}`,
      );
      const formattedMessage2 = Base.color(
        "fail",
        `Total failed files: ${failedFiles}/${allFiles}`,
      );
      const formattedMessage3 = Base.color(
        "fail",
        `Total failed functional tests: ${failedFunctionalCheck}/${allFiles}`,
      );
      // // Log the formatted message
      console.log(`${formattedMessage}`);
      console.log(`${formattedMessage2}`);
      console.log(`${formattedMessage3}`);

      if (exportToJson) {
        // Prepare the data to be exported to JSON
        const results = {
          totalTests: tests,
          passingTests: passes,
          failingTests: failures,
          totalFiles: allFiles,
          passingFiles: passingFiles,
          failingFiles: failedFiles,
          failedFunctionalCheck: failedFunctionalCheck,
          passedFunctionalCheck: passedFunctionalCheck,
          failedFunctionalChecks: failedFunctionalChecks,
          passedResults: passedResults,
          failedResults: failedResults,
        };

        // Write to JSON file
        const jsonPath = path.join(
          __dirname,
          "test-results" + suffix + ".json",
        );
        fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
        console.log(`\nTest results written to ${jsonPath}`);
      }
    });
  }
}

module.exports = CustomReporter;

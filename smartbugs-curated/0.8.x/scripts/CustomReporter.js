const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');
const { fail } = require('assert');

// Extend the Spec reporter
const Spec = Mocha.reporters.Spec;
const Base = Mocha.reporters.Base; // For styling and symbols

const suffix = '';
class CustomReporter extends Spec {
  constructor(runner, options) {
    // Call the parent constructor (Spec reporter)
    super(runner);

    // Initialize variables to track the current file and passing file count
    let passingFiles = 0;
    let currentFile = null;
    let allTestsPassed = true;
    let allFiles = 0;
    const testResults = [];

    const exportOptions = options.reporterOptions || {};
    const exportToJson = exportOptions.json || false;

    // When a new suite (test file) starts
    runner.on('suite', (suite) => {
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
    runner.on('fail', (test, err) => {
      // Mark the current test file as having failed tests
      allTestsPassed = false;
      const fileName = currentFile.split('/test/')[1];
        const contractFile = fileName.replace('_test.js', suffix+ '.sol');
      testResults.push({
        title: test.title,
        file: fileName,
        contractFile: contractFile,
        state: 'failed',
        error: err.message, // Capture the error message
        stack: err.stack,   // Capture the stack trace
      });
    });

        // When a test ends, store its result
    runner.on('test end', (test) => {
        // only get the string after 'test' in the title
        // filename = currentFile.split('/');
        const fileName = currentFile.split('/test/')[1];
        const contractFile = fileName.replace('_test.js', suffix + '.sol');
        // console.log(contract_file);
        if (test.state === 'passed') {
            testResults.push({
                title: test.title,
                file: fileName,
                contractFile: contractFile,
                state: test.state,
            });
        }
     });

    // When the suite (test file) ends
    runner.on('suite end', (suite) => {
      if (suite.file && currentFile === suite.file && allTestsPassed) {
        passingFiles += 1;
      }
    });

    // At the end of all tests, log the number of passing test files in the same style as passing tests
    runner.on('end', () => {
        const { tests, passes, failures, pending, duration } = runner.stats;

        const failedFiles = allFiles - passingFiles;

        const formattedMessage = Base.color('green', `Total passing test files: ${passingFiles}/${allFiles}`);
        const formattedMessage2 = Base.color('fail', `Total failed files: ${failedFiles}/${allFiles}`);
        // // Log the formatted message
        console.log(`${formattedMessage}`);
        console.log(`${formattedMessage2}`);

        if (exportToJson) {
            // Prepare the data to be exported to JSON
            const results = {
                totalTests: tests,
                passingTests: passes,
                failingTests: failures,
                totalFiles: allFiles,
                passingFiles: passingFiles,
                failingFiles: failedFiles,
                testResults: testResults,
            };

            // Write to JSON file
            const jsonPath = path.join(__dirname, 'test-results.json');
            fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
        }
    });
  }
}

module.exports = CustomReporter;

import subprocess
import os
import json
from models.test_result import TestResult
from models.patch import Patch
from testing.exceptions import HardhatRunnerError
from strategies.base import PatchStrategy

class HardhatTestRunner:
    def __init__(self, hardhat_dir: str, results_dir: str):
        """
        Initialize HardhatTestRunner with configuration
        config should contain:
        - working_directory: str (path to project root)
        - hardhat_path: str (path to hardhat executable)
        """
        self.results_dir = results_dir
        self.working_directory = hardhat_dir
        if not os.path.isfile(os.path.join(self.working_directory, "hardhat.config.js")):
            raise HardhatRunnerError(f"Invalid hardhat directory: {hardhat_dir}")
        self.hardhat_path = 'npx hardhat'
        self.compile()
    def get_test_file(self, contract_path: str) -> str:
        """Get the test file for a specific contract"""
        contract_dir, contract_name = os.path.split(contract_path)
        test_name = contract_name.replace(".sol", "_test.js")
        return os.path.join("test", os.path.basename(contract_dir), test_name)

    def _run_command(self, command: str) -> subprocess.CompletedProcess:
        """Helper method to run shell commands"""
        try:
            print("Executing command: ", command)
            result = subprocess.run(
                command,
                shell=True,
                cwd=self.working_directory,
                capture_output=True,
                text=True
            )
            if result.stdout:
                with open(os.path.join(self.results_dir, "hardhat_output.txt"), "w") as f:
                    f.write(result.stdout)
            # check ir stderr is not empty
            if result.stderr:
                with open(os.path.join(self.results_dir, "hardhat_error.txt"), "w") as f:
                    f.write(result.stderr)
            return result
        except Exception as e:
            raise HardhatRunnerError(f"Failed to execute command: {str(e)}")

    def clean(self) -> None:
        """Clean the Hardhat artifacts and cache"""
        self._run_command(f"{self.hardhat_path} clean")

    def compile(self) -> None:
        """Compile the smart contracts"""
        self._run_command(f"{self.hardhat_path} compile")
    
    def test(self, contract_path: str) -> subprocess.CompletedProcess:
        """Run tests for a specific contract"""
        test_file = self.get_test_file(contract_path)
        return self._run_command(f"{self.hardhat_path} test {test_file}")
    
    def _parse_test_result(self, contract_path: str, patch_path: str, result: subprocess.CompletedProcess) -> TestResult:
        """Parse the test result"""
        with open(os.path.join(self.working_directory, "scripts/test-results.json"), "r") as f:
            test_results = json.load(f)
        # move the test results to the results directory
        with open(os.path.join(self.results_dir, "test-results.json"), "w") as f:
            json.dump(test_results, f, indent=4)
        # remove the test results from the hardhat directory
        os.remove(os.path.join(self.working_directory, "scripts/test-results.json"))
        return TestResult(
            contract=contract_path,
            patch_path=os.path.join(*patch_path.split("/")[-3:]),
            total_tests=test_results["totalTests"],
            passed_tests=test_results["passingTests"],
            failed_tests=test_results["failingTests"],
            functional_success=test_results["passedFunctionalCheck"],
            functional_failures=test_results["failedFunctionalCheck"],
            failed_functional_results=test_results["failedFunctionalCheckResults"],
            failed_results=test_results["failedResults"],
            passed_results=test_results["passedResults"]
        )

    def run_tests(self, patch: Patch, strategy: PatchStrategy) -> TestResult:
        """
        Run tests for a specific contract
        Returns TestResult object with test outcomes
        """
        try:
            if strategy.compile():
                self.compile()
            result = self.test(patch.contract_file)

            return self._parse_test_result(patch.contract_file, patch.path, result)

        except Exception as e:
            raise HardhatRunnerError(f"Test execution failed: {str(e)}")

from models.patch import Patch
from models.test_result import TestResult
from core.file_manager import FileManager
from core.strategy_factory import PatchStrategyFactory
from testing.hardhat_runner import HardhatTestRunner
from exceptions import PatchValidationError
import os
import logging

class PatchEvaluator:
    def __init__(self, base_directory: str, results_directory: str):
        self.file_manager = FileManager(base_directory)
        self.dataset_dir = os.path.abspath(os.path.join(base_directory, "contracts", "dataset")).replace(os.sep, '/')
        self.dataset_files = []
        for root, _, files in os.walk(self.dataset_dir):
            for file in files:
                if file.endswith(".sol"):
                    parent_dir = os.path.basename(root)
                    self.dataset_files.append(os.path.join(parent_dir, file).replace(os.sep, '/'))
        self.patch_factory = PatchStrategyFactory()
        self.test_runner = HardhatTestRunner(base_directory, results_directory)
        self.results_directory = results_directory
        self.logger = logging.getLogger(__name__)

    def evaluate_patch(self, patch: Patch) -> TestResult:
        strategy = self.patch_factory.create_strategy(patch)
        normalized_contract_file = patch.contract_file.replace(os.sep, '/')
        self.logger.info(f"Evaluating patch: {patch.path} for contract: {normalized_contract_file}")
        
        try:
            if normalized_contract_file not in self.dataset_files:
                raise PatchValidationError(f"Contract file {normalized_contract_file} not found in dataset({self.dataset_dir}).")
            contract_path = strategy.contract_path(patch)
            self.logger.debug(f"Backing up contract at: {contract_path}")
            self.file_manager.backup(contract_path)

            self.logger.info("Applying patch...")
            strategy.apply(patch, self.file_manager)

            self.logger.info("Running tests...")
            test_result = self.test_runner.run_tests(patch, strategy)

            self.logger.debug("Restoring original contract")
            self.file_manager.restore(contract_path)

            self.logger.info(f"Evaluation complete. Passed tests: {test_result.passed_tests}/{test_result.total_tests}")
            return test_result
        
        except Exception as e:
            self.logger.error(f"Error during patch evaluation: {str(e)}")
            self.file_manager.restore(strategy.contract_path(patch))
            self.file_manager.remove_backup()
            raise e
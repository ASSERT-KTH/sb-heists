import argparse
from core.patch_evaluator import PatchEvaluator
from models.patch import Patch
from constants import PatchFormat
from config import BASE_DIR, LOG_LEVEL
import logging
import os
import datetime

def setup_logging():
    logging.basicConfig(
        level=LOG_LEVEL,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def load_patch(patch_path: str, contract_file: str, main_contract: str, format: str) -> Patch:
    return Patch(patch_path, contract_file, main_contract, PatchFormat(format))

def main():
    setup_logging()
    logger = logging.getLogger(__name__)
    
    parser = argparse.ArgumentParser(description='Evaluate smart contract patches')
    parser.add_argument('--format', required=True, help='Patch format', choices=['solidity', 'bytecode'])
    parser.add_argument('--patch', required=True, help='Path to patch file')
    parser.add_argument('--contract-file', required=True, help=f'Contract file to patch in dataset {os.path.abspath(BASE_DIR)}/contracts/dataset (e.g., reentrancy/reentrancy_simple.sol)')
    parser.add_argument('--main-contract', required=True, help='Main contract to patch')
    parser.add_argument('--output', default='results', help='Output path for results')
    
    args = parser.parse_args()

    try:
        # get time of execution
        time = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        current_dir = os.path.dirname(os.path.abspath(__file__))
        results_dir = os.path.join(os.path.dirname(current_dir), args.output, time)
        results_dir = os.path.abspath(results_dir)
        os.makedirs(results_dir, exist_ok=True)
        logger.info(f"Results will be saved in {results_dir}")
        # Initialize evaluator early to access dataset files
        evaluator = PatchEvaluator(BASE_DIR, results_dir)

        logger.info(f"Loading patch from {args.patch}")
        patch = load_patch(args.patch, args.contract_file, args.main_contract, args.format)
        
        logger.info("Starting patch evaluation")
        result = evaluator.evaluate_patch(patch)
        
        # Print results
        print("\nEvaluation Results:")
        print(f"Contract File: {result.contract}")
        print(f"Patch File: {result.patch_path}")
        print(f"Total Tests: {result.total_tests}")
        print(f"Passed Tests: {result.passed_tests}")
        print(f"Functional Check Success: {result.functional_success}")
        print(f"Fuctional Check Failures: {result.functional_failures}")
        
        if result.failed_functional_results:
            print("\nFunctional Check Failures:")
            for failure in result.failed_functional_results:
                print(f"- {failure}")
        
        if result.failed_results:
            print(f"\nExploit Test Failures ({len(result.failed_results)}):")
            for failure in result.failed_results:
                print(f"- Exploit file: {failure["file"]}")
                print(f"  Contract File: {failure["contractFile"]}")
                print(f"  Error: {failure["error"]}")

        print(f"\nResults saved in {results_dir}")
                
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main()

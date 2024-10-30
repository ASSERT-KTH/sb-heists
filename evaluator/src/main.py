import argparse
from core.patch_evaluator import PatchEvaluator
from models.patch import Patch
from constants import PatchFormat
from config import BASE_DIR, LOG_LEVEL
import logging

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
    parser.add_argument('--contract-file', required=True, help='Contract file to patch')
    parser.add_argument('--main-contract', required=True, help='Main contract to patch')
    
    args = parser.parse_args()

    try:
        logger.info(f"Loading patch from {args.patch}")
        patch = load_patch(args.patch, args.contract_file, args.main_contract, args.format)
        
        logger.info("Initializing patch evaluator")
        evaluator = PatchEvaluator(BASE_DIR)
        
        logger.info("Starting patch evaluation")
        result = evaluator.evaluate_patch(patch)
        
        # Print results
        print("\nEvaluation Results:")
        print(f"Contract File: {result.contract}")
        print(f"Patch File: {result.patch_path}")
        print(f"Total Tests: {result.total_tests}")
        print(f"Passed Tests: {result.passed_tests}")
        print(f"Sanity Success: {result.sanity_success}")
        print(f"Sanity Failures: {result.sanity_failures}")
        
        if result.failed_sanity_results:
            print("\nSanity Test Failures:")
            for failure in result.failed_sanity_results:
                print(f"- {failure}")
        
        if result.failed_results:
            print("\nExploit Test Failures:")
            for failure in result.failed_results:
                print(f"- {failure}")
                
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main()

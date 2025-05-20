# Patch Evaluator

A tool for evaluating smart contract patches by running test suites and analyzing results.
This tool currently supports the follwing dataset: `smartbugs-curated/0.4.x/contracts/dataset`.

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd evaluator
```

2. Create and activate a virtual environment (recommended):
```bash
python -m venv .venv
source .venv/bin/activate
```

3. Install the package in development mode:
```bash
pip install -e ".[dev]"
```

## Configuration

The tool uses several configuration settings that can be modified in `src/config.py`:

- `BASE_DIR`: Base directory for hardhat project
- `LOG_LEVEL`: Logging verbosity (default: "ERROR")
- `DEFAULT_BACKUP_SUFFIX`: Suffix for backup files (default: ".bak")

## Usage

The evaluator can be run from the command line with the following arguments:

```bash
python src/main.py \
    --format <solidity|bytecode> \
    --patch <path-to-patch-file> \
    --contract-file <contract-from-dataset> \
    --main-contract <contract-name>
    --output <output-directory>
```

### Required Arguments

- `--format`: The format of the patch file (choices: 'solidity' or 'bytecode')
- `--patch`: Path to the patch file that will be evaluated
- `--contract-file`: Contract in `smartbugs-curated/0.4.x/contracts/dataset`. Required format `<vulnerability-type>/<filename>`.
- `--main-contract`: Name of the main contract to be patched
- `--output`: Path to output directory to store results. Default: `./results`

### Example

```bash
python src/main.py \
    --format solidity \
    --patch ./example/reentrancy_simple_patch.sol \
    --contract-file reentrance/reentrancy_simple.sol \
    --main-contract Reentrance
```

## Output

The tool will output evaluation results including:
- Contract and patch file information
- Total number of tests run
- Number of passed tests
- Functional check results
- Details of any test failures

Example output:
```
Evaluation Results:
Contract File: reentrancy/reentrancy_simple.sol
Patch File: ./examples/reentrancy_simple_patch.sol
Total Tests: 2
Passed Tests: 1
Functional Check Success: 1
Fuctional Check Failures: 0

Exploit Test Failures (1):
- Exploit file: reentrancy/reentrancy_simple_test.js
  Contract File: reentrancy/reentrancy_simple.sol
  Error: Transaction reverted without a reason string

Results saved in /sb-heist/evaluator/results/20250520_101154
```

In the `results/20250520_101154` you will find the following:
- `hardhat_error.txt`: Warnings and errors from hardhat compilation and testing processes.
- `hardhat_output.txt`: Standard output of hardhat reporter.
- `test-results.json`: json file with test results.

## Development

To run tests:
```bash
pytest
```

To run tests with coverage:
```bash
pytest --cov=src
```


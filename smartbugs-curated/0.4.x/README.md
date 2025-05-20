# Automatic Exploit Testing for SmartBugs Contracts

This repository contains automated exploit tests for vulnerabilities found in the SmartBugs-curated smart contract dataset. The tests are implemented using the Hardhat testing framework.

## Overview

The project demonstrates various security vulnerabilities in Ethereum smart contracts by providing:
- Vulnerable contracts from the SmartBugs-Curated dataset
- Exploit contracts that demonstrate the vulnerabilities
- Automated tests that verify the exploits

## Project Structure

```
.
├── contracts/
│   ├── dataset/           # Original vulnerable contracts from SmartBugs
│   └── <category>/        # Exploit contracts organized by vulnerability type
│       └── *_attack.sol   # Exploit contract for each vulnerability
│
├── test/
│   └── <category>/        # Test files organized by vulnerability type
│       └── *_test.js      # Test scripts that demonstrate exploits
│
├── artifacts/             # Compiled contract files (generated)
└── hardhat.config.js      # Hardhat configuration
```

## Getting Started

### Prerequisites

- Node.js (v20.14.0 or later)
- npm (v10.7.0 or later)

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd smartbugs-curated/0.4.x
```

2. Install dependencies

```bash
npm ci
```

### Running Tests

Run all exploit tests:
```bash
npx hardhat test
```

Run a specific exploit test:
```bash
npx hardhat test test/<category>/<test_name>_test.js
```

## Example

To test a specific reentrancy vulnerability:
```bash
npx hardhat test test/reentrancy/simple_dao_test.js
```

## Test Results

Each test file contains two types of tests:

### 1. Functional Check Tests
Verify normal contract behavior without exploiting vulnerabilities. These ensure the contract works as intended under normal circumstances.

### 2. Exploit Tests
Demonstrate the vulnerability by executing attack sequences that exploit the security weakness.

Example output:
```bash
    Reentrancy Attack for simpleDAO.sol
    ✔ functional check: reentrancy/simpleDAO.sol (632ms)
    ✔ should successfully drain funds through reentrancy attack

  2 passing (651ms)

```

## Contributing

Feel free to contribute by:
1. Adding new exploit contracts
2. Improving existing tests
3. Enhancing documentation

Please ensure all new exploits follow the existing directory structure and naming conventions.
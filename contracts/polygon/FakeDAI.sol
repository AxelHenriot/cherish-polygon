// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FakeDai is ERC20("FakeDai", "fDAI") {
    uint256 public INITIAL_SUPPLY = 1000000 * 10**18;

    constructor() public {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}

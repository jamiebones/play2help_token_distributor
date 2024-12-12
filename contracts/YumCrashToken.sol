// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract YumCrashToken is ERC20 {
    // Define the total supply constant
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10 ** 18; 

    constructor(address _distributor) ERC20("YumCrashT", "YCT") {
        // Mint the total supply to the deployer's address
        _mint(_distributor, MAX_SUPPLY);
    }
}

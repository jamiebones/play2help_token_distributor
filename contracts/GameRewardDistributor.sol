// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract GameRewardDistributor is Ownable {
    // Merkle root for validating user claims
    bytes32 public merkleRoot;
    // Mapping to track claimed tokens per user and token
    mapping(address => mapping(address => uint256)) public claimedAmounts;
    event MerkleRootUpdated(bytes32 indexed newMerkleRoot);
    event TokensClaimed(address indexed user, address indexed token, uint256 amount);

    error MerkleRootCanNotBeZeroError();
    error ZeroAddressError();
    error AmountMustBeBiggerThanZeroError();
    error InvalidMerkelProofError();
    error NoAmountLeftToClaimError();
    error LessBalanceError();

    constructor() Ownable(msg.sender){
        merkleRoot = keccak256(abi.encodePacked(""));
    }

    /**
     * @dev Updates the Merkle root. Only the owner can update it.
     */
    function updateMerkleRoot(bytes32 _newMerkleRoot) external onlyOwner {
        if ( _newMerkleRoot == bytes32(0)){
            revert MerkleRootCanNotBeZeroError();
        }
        merkleRoot = _newMerkleRoot;
        emit MerkleRootUpdated(_newMerkleRoot);
    }

    /**
     * @dev Claim tokens using a Merkle proof.
     * @param token The ERC20 token address.
     * @param amount The amount of tokens to claim.
     * @param proof The Merkle proof for the claim.
     */
    function claimTokens(address token, uint256 amount, bytes32[] calldata proof) external {
        if ( token == address(0)){
            revert ZeroAddressError();
        }
        if ( amount == 0 ){
            revert AmountMustBeBiggerThanZeroError();
        }
        bytes32 leaf = keccak256(abi.encode(msg.sender, token, amount));
        if (!MerkleProof.verify(proof, merkleRoot, leaf)){
            revert InvalidMerkelProofError();
        }
       
        uint256 alreadyClaimed = claimedAmounts[msg.sender][token];
        if (alreadyClaimed >= amount ){
            revert NoAmountLeftToClaimError();
        }
        //require(alreadyClaimed < amount, "No claimable amount left");

        uint256 claimableAmount = amount - alreadyClaimed;
        claimedAmounts[msg.sender][token] = amount;

        uint256 contractTokenBalance = IERC20(token).balanceOf(address(this));
        if ( contractTokenBalance < claimableAmount ){
            revert LessBalanceError();
        }
        
        IERC20(token).transfer(msg.sender, claimableAmount);
        emit TokensClaimed(msg.sender, token, claimableAmount);
    }

    /**
     * @dev Withdraw tokens from the contract (onlyOwner).
     * @param token The ERC20 token address.
     * @param amount The amount of tokens to withdraw.
     */
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        if ( token == address(0)){
            revert ZeroAddressError();
        }
        if ( amount == 0 ){
            revert AmountMustBeBiggerThanZeroError();
        }
        IERC20(token).transfer(msg.sender, amount);
    }
}
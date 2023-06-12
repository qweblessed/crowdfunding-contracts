//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "hardhat/console.sol";

contract MerkleVesting is Ownable {
    bytes32 public merkleRoot;
    mapping(address => bool) public claimAddresses;
    IERC20 public immutable token;

    event Claim(address indexed claimer, uint256 amount);
    event Vest(bytes32 indexed merkleProof);

    constructor(IERC20 vestedToken) {
        token = vestedToken;
    }

    function vestTokens(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit Vest(merkleRoot);
    }

    function claimTokens(uint256 amount, bytes32[] calldata merkleProof)
        external
    {
        require(canClaimTokens(amount, merkleProof), "Vesting: cannot claim");

        claimAddresses[msg.sender] = true;
        token.transfer(msg.sender, amount);
        emit Claim(msg.sender, amount);
    }

    function canClaimTokens(uint256 amount, bytes32[] calldata merkleProof)
        public
        view
        returns (bool)
    {
        return
            claimAddresses[msg.sender] == false &&
            MerkleProof.verify(
                merkleProof,
                merkleRoot,
                keccak256(abi.encodePacked(msg.sender, amount))
            );
    }
}

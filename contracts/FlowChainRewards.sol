// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FlowChainRewards {
    address public owner;
    uint256 public constant MAX_REWARD_PER_CLAIM = 25;

    mapping(address => uint256) public rewards;
    mapping(address => mapping(bytes32 => bool)) public claimedRouteIds;

    event RewardClaimed(address indexed user, bytes32 indexed routeId, uint256 amount, uint256 totalRewards);
    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error InvalidAmount();
    error RouteAlreadyClaimed();
    error ZeroAddressOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddressOwner();
        owner = initialOwner;
        emit OwnerTransferred(address(0), initialOwner);
    }

    function claimReward(bytes32 routeId, uint256 amount) external {
        if (amount == 0 || amount > MAX_REWARD_PER_CLAIM) revert InvalidAmount();
        if (claimedRouteIds[msg.sender][routeId]) revert RouteAlreadyClaimed();

        claimedRouteIds[msg.sender][routeId] = true;
        rewards[msg.sender] += amount;

        emit RewardClaimed(msg.sender, routeId, amount, rewards[msg.sender]);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddressOwner();
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }
}

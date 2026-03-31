// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Escrow Smart Contract
/// @author Daniel Araya & Andrés Mora
/// @notice Enables secure fund holding between buyer, seller, and arbiter
/// @dev Implements dispute resolution and safe fund transfer patterns
contract Escrow {


    /// @notice Represents the state of an escrow
    /// AWAITING_DELIVERY: Funds are locked, waiting for confirmation
    /// DISPUTED: Dispute has been raised
    /// COMPLETED: Funds released to seller
    /// REFUNDED: Funds returned to buyer
    enum State { AWAITING_DELIVERY, DISPUTED, COMPLETED, REFUNDED }

    /// @notice Stores all escrow details
    /// @param buyer Address of the buyer
    /// @param seller Address of the seller
    /// @param arbiter Address responsible for dispute resolution
    /// @param amount Amount of funds locked in escrow
    /// @param state Current state of the escrow
    struct EscrowData {
        address payable buyer;
        address payable seller;
        address arbiter;
        uint256 amount;
        State state;
    }

    uint256 public escrowCount;
    mapping(uint256 => EscrowData) public escrows;

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        address arbiter,
        uint256 amount
    );

    event DeliveryConfirmed(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event DisputeRaised(uint256 indexed escrowId);

    event DisputeResolved(uint256 indexed escrowId, bool sellerWon);

    modifier escrowExists(uint256 _id) {
        require(escrows[_id].buyer != address(0), "Escrow doesn't exist");
        _;
    }

    modifier onlyBuyer(uint256 _id) {
        require(msg.sender == escrows[_id].buyer, "Only the buyer");
        _;
    }

    /// @notice Creates a new escrow and locks funds
    /// @param _seller Address of the seller
    /// @param _arbiter Address of the arbiter
    /// @return escrowId The ID of the created escrow
    function createEscrow(address payable _seller, address _arbiter) external payable returns (uint256) {
        require(msg.value > 0, "Must  send funds");
        require(_seller != address(0), "Invalid seller");
        require(_arbiter != address(0), "Invalid arbiter");
        require(msg.sender != _seller, "Buyer can't be seller");
        require(msg.sender != _arbiter, "Buyer can't be arbiter");
        require(_seller != _arbiter, "Seller can't be arbiter");

        uint256 escrowId = escrowCount;
        escrowCount++;

        escrows[escrowId] = EscrowData({
            buyer: payable(msg.sender),
            seller: _seller,
            arbiter: _arbiter,
            amount: msg.value,
            state: State.AWAITING_DELIVERY
        });

        emit EscrowCreated(escrowId, msg.sender, _seller, _arbiter, msg.value);

        return escrowId;
    }

    /// @notice Buyer confirms delivery and releases funds to seller
    /// @param _escrowId ID of the escrow
    /// @dev Uses checks-effects-interactions pattern
    function confirmDelivery(uint256 _escrowId) external
        escrowExists(_escrowId)
        onlyBuyer(_escrowId){
        EscrowData storage e = escrows[_escrowId];
        
        require(e.state == State.AWAITING_DELIVERY, "Invalid state");

        uint256 amount = e.amount;
        address payable seller = e.seller;

        // Effects antes de interactions
        e.state = State.COMPLETED;
        e.amount = 0;

        // Interaction
        (bool success, ) = seller.call{value: amount}("");
        require(success, "Failed transaction");

        emit DeliveryConfirmed(_escrowId, msg.sender, seller, amount);
    }

    /// @notice Raises a dispute for an escrow
    /// @param _escrowId ID of the escrow
    /// @dev Can be called by buyer or seller only
    function raiseDispute(uint256 _escrowId) external escrowExists(_escrowId){
        EscrowData storage e = escrows[_escrowId];

        require(msg.sender == e.buyer || msg.sender == e.seller, "Unauthorized");
        require(e.state == State.AWAITING_DELIVERY, "Invalid state");

        e.state = State.DISPUTED;

        emit DisputeRaised(_escrowId);
    }

    /// @notice Resolves a dispute and releases funds
    /// @param _escrowId ID of the escrow
    /// @param releaseToSeller True if seller wins, false if buyer gets refunded
    /// @dev Only arbiter can call this function
    function resolveDispute(uint256 _escrowId, bool releaseToSeller) external escrowExists(_escrowId){
        EscrowData storage e = escrows[_escrowId];

        require(msg.sender == e.arbiter, "Only the arbiter");
        require(e.state == State.DISPUTED, "Isn't in dispute");

        uint256 amount = e.amount;

        // Effects
        e.amount = 0;

        if (releaseToSeller) {
            e.state = State.COMPLETED;

            (bool success, ) = e.seller.call{value: amount}("");
            require(success, "Error transferring funds to seller");
        } else {
            e.state = State.REFUNDED;

            (bool success, ) = e.buyer.call{value: amount}("");
            require(success, "Error refunding buyer");
        }

        emit DisputeResolved(_escrowId, releaseToSeller);
    }
}

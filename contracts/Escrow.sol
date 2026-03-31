// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Escrow Smart Contract
contract Escrow {

    enum State { AWAITING_DELIVERY, DISPUTED, COMPLETED, REFUNDED }

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

    /// @notice El comprador crea un escrow depositando fondos
    /// @param _seller Dirección del vendedor
    /// @param _arbiter Dirección del árbitro
    /// @return escrowId Identificador del escrow creado
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

    /// @notice El comprador confirma la entrega y libera los fondos al vendedor
    /// @param _escrowId Identificador del escrow
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

    function raiseDispute(uint256 _escrowId) external escrowExists(_escrowId){
        EscrowData storage e = escrows[_escrowId];

        require(msg.sender == e.buyer || msg.sender == e.seller, "Unauthorized");
        require(e.state == State.AWAITING_DELIVERY, "Invalid state");

        e.state = State.DISPUTED;

        emit DisputeRaised(_escrowId);
    }

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

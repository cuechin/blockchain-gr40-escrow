// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Escrow - Sistema de custodia de fondos entre comprador, vendedor y árbitro
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

    /// @notice El comprador crea un escrow depositando fondos
    /// @param _seller Dirección del vendedor
    /// @param _arbiter Dirección del árbitro
    /// @return escrowId Identificador del escrow creado
    function createEscrow(address payable _seller, address _arbiter) external payable returns (uint256) {
        require(msg.value > 0, "Debe enviar fondos");
        require(_seller != address(0), "Seller invalido");
        require(_arbiter != address(0), "Arbiter invalido");
        require(msg.sender != _seller, "Buyer no puede ser seller");
        require(msg.sender != _arbiter, "Buyer no puede ser arbiter");
        require(_seller != _arbiter, "Seller no puede ser arbiter");

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
}

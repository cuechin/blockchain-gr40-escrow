export const CONTRACT_ADDRESS = "0x0384B97Ca3D22B8e8340B02B3475F85476aD5EA5";

export const ESCROW_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "escrowId", type: "uint256" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "DeliveryConfirmed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "uint256", name: "escrowId", type: "uint256" }],
    name: "DisputeRaised",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "escrowId", type: "uint256" },
      { indexed: false, internalType: "bool", name: "sellerWon", type: "bool" },
    ],
    name: "DisputeResolved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "escrowId", type: "uint256" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "address", name: "arbiter", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "EscrowCreated",
    type: "event",
  },
  {
    inputs: [{ internalType: "uint256", name: "_escrowId", type: "uint256" }],
    name: "confirmDelivery",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address payable", name: "_seller", type: "address" },
      { internalType: "address", name: "_arbiter", type: "address" },
    ],
    name: "createEscrow",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "escrowCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "escrows",
    outputs: [
      { internalType: "address payable", name: "buyer", type: "address" },
      { internalType: "address payable", name: "seller", type: "address" },
      { internalType: "address", name: "arbiter", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "enum Escrow.State", name: "state", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_escrowId", type: "uint256" }],
    name: "raiseDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_escrowId", type: "uint256" },
      { internalType: "bool", name: "releaseToSeller", type: "bool" },
    ],
    name: "resolveDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const STATE_LABELS = [
  "AWAITING_DELIVERY",
  "DISPUTED",
  "COMPLETED",
  "REFUNDED",
];

export const STATE_COLORS = {
  AWAITING_DELIVERY: "#f59e0b",
  DISPUTED: "#ef4444",
  COMPLETED: "#10b981",
  REFUNDED: "#6366f1",
};

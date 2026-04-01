const { ethers } = require("hardhat");

const STATES = ["AWAITING_DELIVERY", "DISPUTED", "COMPLETED", "REFUNDED"];

async function getContract() {
  const address = process.env.ESCROW_CONTRACT_ADDRESS;
  if (!address) throw new Error("Missing ESCROW_CONTRACT_ADDRESS");

  console.log("Contract:", address);
  return ethers.getContractAt("Escrow", address);
}

async function create(escrow, buyer, seller, arbiter) {
  const amount = ethers.parseEther("1");

  console.log("\n--- CREATE ESCROW ---");
  console.log("Buyer:", buyer.address);
  console.log("Seller:", seller.address);
  console.log("Arbiter:", arbiter.address);
  console.log("Amount:", ethers.formatEther(amount), "ETH");

  const tx = await escrow
    .connect(buyer)
    .createEscrow(seller.address, arbiter.address, { value: amount });

  const receipt = await tx.wait();
  console.log("Tx:", receipt.hash);

  const id = (await escrow.escrowCount()) - 1n;

  console.log("Escrow ID:", id.toString());
  return id;
}

async function confirm(escrow, buyer, id, seller) {
  console.log("\n--- CONFIRM DELIVERY ---");

  const before = await ethers.provider.getBalance(seller.address);

  const tx = await escrow.connect(buyer).confirmDelivery(id);
  await tx.wait();

  const after = await ethers.provider.getBalance(seller.address);

  console.log("Seller received:", ethers.formatEther(after - before), "ETH");
}

async function dispute(escrow, actor, id) {
  console.log("\n--- RAISE DISPUTE ---");

  const tx = await escrow.connect(actor).raiseDispute(id);
  await tx.wait();

  console.log("Dispute opened");
}

async function resolve(escrow, arbiter, id, sellerWins, buyer, seller) {
  console.log("\n--- RESOLVE DISPUTE ---");

  const beforeSeller = await ethers.provider.getBalance(seller.address);
  const beforeBuyer = await ethers.provider.getBalance(buyer.address);

  const tx = await escrow
    .connect(arbiter)
    .resolveDispute(id, sellerWins);

  await tx.wait();

  const afterSeller = await ethers.provider.getBalance(seller.address);
  const afterBuyer = await ethers.provider.getBalance(buyer.address);

  if (sellerWins) {
    console.log("Winner: SELLER");
    console.log("Seller received:", ethers.formatEther(afterSeller - beforeSeller));
  } else {
    console.log("Winner: BUYER");
    console.log("Buyer refunded:", ethers.formatEther(afterBuyer - beforeBuyer));
  }
}

async function printState(escrow, id) {
  const data = await escrow.escrows(id);
  const contractBalance = await ethers.provider.getBalance(await escrow.getAddress());

  console.log("\n--- STATE ---");
  console.log("State:", STATES[Number(data.state)]);
  console.log("Amount:", ethers.formatEther(data.amount));
  console.log("Contract balance:", ethers.formatEther(contractBalance));
}

async function main() {
  const action = process.env.ACTION;
  const escrowId = process.env.ESCROW_ID;
  const sellerWins = process.env.SELLER_WINS === "true";

  const [buyer, seller, arbiter] = await ethers.getSigners();
  const escrow = await getContract();

  let id;

  switch (action) {
    case "full":
      id = await create(escrow, buyer, seller, arbiter);
      await dispute(escrow, buyer, id);
      await resolve(escrow, arbiter, id, true, buyer, seller);
      await printState(escrow, id);
      break;

    case "confirm":
      if (!escrowId) throw new Error("ESCROW_ID missing");
      await confirm(escrow, buyer, escrowId, seller);
      await printState(escrow, escrowId);
      break;

    case "dispute":
      if (!escrowId) throw new Error("ESCROW_ID missing");
      await dispute(escrow, buyer, escrowId);
      await printState(escrow, escrowId);
      break;

    case "resolve":
      if (!escrowId) throw new Error("ESCROW_ID missing");
      await resolve(escrow, arbiter, escrowId, sellerWins, buyer, seller);
      await printState(escrow, escrowId);
      break;

    default:
      console.log("Uso:");
      console.log("ACTION=full yarn local:interact");
      console.log("ACTION=confirm ESCROW_ID=0 yarn local:interact");
      console.log("ACTION=dispute ESCROW_ID=0 yarn local:interact");
      console.log("ACTION=resolve ESCROW_ID=0 SELLER_WINS=true yarn local:interact");
  }
}

main().catch(console.error);
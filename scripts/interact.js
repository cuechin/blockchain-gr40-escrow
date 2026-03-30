const { ethers } = require("hardhat");

async function main() {
  const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("Define ESCROW_CONTRACT_ADDRESS en tu entorno antes de ejecutar el script");
  }

  const [buyer, seller, arbiter] = await ethers.getSigners();
  const escrow = await ethers.getContractAt("Escrow", contractAddress);
  const depositAmount = ethers.parseEther("1.0");

  console.log("Contract address:", contractAddress);
  console.log("Buyer:", buyer.address);
  console.log("Seller:", seller.address);
  console.log("Arbiter:", arbiter.address);
  console.log("Deposit amount:", ethers.formatEther(depositAmount), "ETH/POL");

  const tx = await escrow
    .connect(buyer)
    .createEscrow(seller.address, arbiter.address, { value: depositAmount });

  const receipt = await tx.wait();
  console.log("Tx hash:", receipt.hash);

  const escrowId = (await escrow.escrowCount()) - 1n;
  const escrowData = await escrow.escrows(escrowId);
  const contractBalance = await ethers.provider.getBalance(contractAddress);

  console.log("Escrow created with id:", escrowId.toString());
  console.log("Stored buyer:", escrowData.buyer);
  console.log("Stored seller:", escrowData.seller);
  console.log("Stored arbiter:", escrowData.arbiter);
  console.log("Stored amount:", ethers.formatEther(escrowData.amount), "ETH/POL");
  console.log("Stored state:", escrowData.state.toString(), "(0 = AWAITING_DELIVERY)");
  console.log("Contract balance:", ethers.formatEther(contractBalance), "ETH/POL");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

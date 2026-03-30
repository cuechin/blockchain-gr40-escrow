const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow", function () {
	let escrow, buyer, seller, arbiter;

	beforeEach(async function () {
		[buyer, seller, arbiter] = await ethers.getSigners();
		const Escrow = await ethers.getContractFactory("Escrow");
		escrow = await Escrow.deploy();
		await escrow.waitForDeployment();
	});

	describe("createEscrow", function () {
		it("should create an escrow with correct data", async function () {
			const amount = ethers.parseEther("1.0");
			const tx = await escrow.connect(buyer).createEscrow(seller.address, arbiter.address, { value: amount });
			await tx.wait();

			const data = await escrow.escrows(0);
			expect(data.buyer).to.equal(buyer.address);
			expect(data.seller).to.equal(seller.address);
			expect(data.arbiter).to.equal(arbiter.address);
			expect(data.amount).to.equal(amount);
			expect(data.state).to.equal(0); // AWAITING_DELIVERY
		});

		it("should emit EscrowCreated event", async function () {
			const amount = ethers.parseEther("1.0");
			await expect(
				escrow.connect(buyer).createEscrow(seller.address, arbiter.address, { value: amount })
			)
				.to.emit(escrow, "EscrowCreated")
				.withArgs(0, buyer.address, seller.address, arbiter.address, amount);
		});

		it("should increment escrowCount", async function () {
			const amount = ethers.parseEther("0.5");
			await escrow.connect(buyer).createEscrow(seller.address, arbiter.address, { value: amount });
			await escrow.connect(buyer).createEscrow(seller.address, arbiter.address, { value: amount });
			expect(await escrow.escrowCount()).to.equal(2);
		});

		it("should hold funds in the contract", async function () {
			const amount = ethers.parseEther("2.0");
			await escrow.connect(buyer).createEscrow(seller.address, arbiter.address, { value: amount });
			const balance = await ethers.provider.getBalance(await escrow.getAddress());
			expect(balance).to.equal(amount);
		});

		it("should revert if no funds sent", async function () {
			await expect(
				escrow.connect(buyer).createEscrow(seller.address, arbiter.address, { value: 0 })
			).to.be.revertedWith("Debe enviar fondos");
		});

		it("should revert if seller is zero address", async function () {
			await expect(
				escrow.connect(buyer).createEscrow(ethers.ZeroAddress, arbiter.address, { value: ethers.parseEther("1") })
			).to.be.revertedWith("Seller invalido");
		});

		it("should revert if buyer is same as seller", async function () {
			await expect(
				escrow.connect(buyer).createEscrow(buyer.address, arbiter.address, { value: ethers.parseEther("1") })
			).to.be.revertedWith("Buyer no puede ser seller");
		});

		it("should revert if seller is same as arbiter", async function () {
			await expect(
				escrow.connect(buyer).createEscrow(seller.address, seller.address, { value: ethers.parseEther("1") })
			).to.be.revertedWith("Seller no puede ser arbiter");
		});
	});
});

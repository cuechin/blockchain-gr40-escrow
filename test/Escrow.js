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
      const tx = await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });
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
        escrow
          .connect(buyer)
          .createEscrow(seller.address, arbiter.address, { value: amount }),
      )
        .to.emit(escrow, "EscrowCreated")
        .withArgs(0, buyer.address, seller.address, arbiter.address, amount);
    });

    it("should increment escrowCount", async function () {
      const amount = ethers.parseEther("0.5");
      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });
      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });
      expect(await escrow.escrowCount()).to.equal(2);
    });

    it("should hold funds in the contract", async function () {
      const amount = ethers.parseEther("2.0");
      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });
      const balance = await ethers.provider.getBalance(
        await escrow.getAddress(),
      );
      expect(balance).to.equal(amount);
    });

    it("should revert if no funds sent", async function () {
      await expect(
        escrow
          .connect(buyer)
          .createEscrow(seller.address, arbiter.address, { value: 0 }),
      ).to.be.revertedWith("Must  send funds");
    });

    it("should revert if seller is zero address", async function () {
      await expect(
        escrow
          .connect(buyer)
          .createEscrow(ethers.ZeroAddress, arbiter.address, {
            value: ethers.parseEther("1"),
          }),
      ).to.be.revertedWith("Invalid seller");
    });

    it("should revert if buyer is same as seller", async function () {
      await expect(
        escrow.connect(buyer).createEscrow(buyer.address, arbiter.address, {
          value: ethers.parseEther("1"),
        }),
      ).to.be.revertedWith("Buyer can't be seller");
    });

    it("should revert if seller is same as arbiter", async function () {
      await expect(
        escrow.connect(buyer).createEscrow(seller.address, seller.address, {
          value: ethers.parseEther("1"),
        }),
      ).to.be.revertedWith("Seller can't be arbiter");
    });

    it("should index escrows correctly by user", async function () {
      const amount = ethers.parseEther("1.0");

      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });

      const buyerEscrows = await escrow.getEscrowsByBuyer(buyer.address);
      const sellerEscrows = await escrow.getEscrowsBySeller(seller.address);
      const arbiterEscrows = await escrow.getEscrowsByArbiter(arbiter.address);

      expect(buyerEscrows[0]).to.equal(0);
      expect(sellerEscrows[0]).to.equal(0);
      expect(arbiterEscrows[0]).to.equal(0);
    });
  });

  describe("confirmDelivery", function () {
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });
    });

    it("should transfer funds to seller and set state to COMPLETED", async function () {
      const sellerBalanceBefore = await ethers.provider.getBalance(
        seller.address,
      );

      const tx = await escrow.connect(buyer).confirmDelivery(0);
      await tx.wait();

      const data = await escrow.escrows(0);
      expect(data.state).to.equal(2); // COMPLETED

      const sellerBalanceAfter = await ethers.provider.getBalance(
        seller.address,
      );
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(amount);

      const contractBalance = await ethers.provider.getBalance(
        await escrow.getAddress(),
      );
      expect(contractBalance).to.equal(0);
    });

    it("should emit DeliveryConfirmed event", async function () {
      await expect(escrow.connect(buyer).confirmDelivery(0))
        .to.emit(escrow, "DeliveryConfirmed")
        .withArgs(0, buyer.address, seller.address, amount);
    });

    it("should revert if caller is not the buyer", async function () {
      await expect(
        escrow.connect(seller).confirmDelivery(0),
      ).to.be.revertedWith("Only the buyer");
    });

    it("should revert if escrow does not exist", async function () {
      await expect(
        escrow.connect(buyer).confirmDelivery(99),
      ).to.be.revertedWith("Escrow doesn't exist");
    });

    it("should revert if already completed", async function () {
      await escrow.connect(buyer).confirmDelivery(0);
      await expect(escrow.connect(buyer).confirmDelivery(0)).to.be.revertedWith(
        "Invalid state",
      );
    });

    it("should revert confirmDelivery if escrow expired", async function () {
      const amount = ethers.parseEther("1.0");

      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });

      await network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await network.provider.send("evm_mine");

      await expect(escrow.connect(buyer).confirmDelivery(0)).to.be.revertedWith(
        "Escrow expired",
      );
    });
  });

  describe("raiseDispute", function () {
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });
    });

    it("should change state to DISPUTED", async function () {
      await escrow.connect(buyer).raiseDispute(0);

      const data = await escrow.escrows(0);
      expect(data.state).to.equal(1); // DISPUTED
    });

    it("should allow seller to raise dispute", async function () {
      await escrow.connect(seller).raiseDispute(0);

      const data = await escrow.escrows(0);
      expect(data.state).to.equal(1);
    });

    it("should emit DisputeRaised event", async function () {
      await expect(escrow.connect(buyer).raiseDispute(0))
        .to.emit(escrow, "DisputeRaised")
        .withArgs(0);
    });

    it("should revert if caller is not buyer or seller", async function () {
      await expect(escrow.connect(arbiter).raiseDispute(0)).to.be.revertedWith(
        "Unauthorized",
      );
    });

    it("should revert if escrow does not exist", async function () {
      await expect(escrow.connect(buyer).raiseDispute(99)).to.be.revertedWith(
        "Escrow doesn't exist",
      );
    });

    it("should revert if already disputed", async function () {
      await escrow.connect(buyer).raiseDispute(0);

      await expect(escrow.connect(buyer).raiseDispute(0)).to.be.revertedWith(
        "Invalid state",
      );
    });

    it("should revert if already completed", async function () {
      await escrow.connect(buyer).confirmDelivery(0);

      await expect(escrow.connect(buyer).raiseDispute(0)).to.be.revertedWith(
        "Invalid state",
      );
    });

    it("should revert raiseDispute if escrow expired", async function () {
      const amount = ethers.parseEther("1.0");

      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });

      await network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await network.provider.send("evm_mine");

      await expect(escrow.connect(buyer).raiseDispute(0)).to.be.revertedWith(
        "Escrow expired",
      );
    });
  });

  describe("resolveDispute", function () {
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });
      await escrow.connect(buyer).raiseDispute(0);
    });

    it("should transfer funds to seller when arbiter resolves in favor of seller", async function () {
      const sellerBalanceBefore = await ethers.provider.getBalance(
        seller.address,
      );

      await escrow.connect(arbiter).resolveDispute(0, true);

      const data = await escrow.escrows(0);
      expect(data.state).to.equal(2); // COMPLETED

      const sellerBalanceAfter = await ethers.provider.getBalance(
        seller.address,
      );
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(amount);

      const contractBalance = await ethers.provider.getBalance(
        await escrow.getAddress(),
      );
      expect(contractBalance).to.equal(0);
    });

    it("should refund buyer when arbiter resolves in favor of buyer", async function () {
      const buyerBalanceBefore = await ethers.provider.getBalance(
        buyer.address,
      );

      await escrow.connect(arbiter).resolveDispute(0, false);

      const data = await escrow.escrows(0);
      expect(data.state).to.equal(3); // REFUNDED

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      expect(buyerBalanceAfter).to.be.closeTo(
        buyerBalanceBefore + amount,
        ethers.parseEther("0.01"), // margen por gas
      );

      const contractBalance = await ethers.provider.getBalance(
        await escrow.getAddress(),
      );
      expect(contractBalance).to.equal(0);
    });

    it("should emit DisputeResolved event", async function () {
      await expect(escrow.connect(arbiter).resolveDispute(0, true))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(0, true);
    });

    it("should revert if caller is not arbiter", async function () {
      await expect(
        escrow.connect(buyer).resolveDispute(0, true),
      ).to.be.revertedWith("Only the arbiter");
    });

    it("should revert if escrow does not exist", async function () {
      await expect(
        escrow.connect(arbiter).resolveDispute(99, true),
      ).to.be.revertedWith("Escrow doesn't exist");
    });

    it("should revert if not in disputed state", async function () {
      const Escrow = await ethers.getContractFactory("Escrow");
      const newEscrow = await Escrow.deploy();
      await newEscrow.waitForDeployment();

      await newEscrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });

      await expect(
        newEscrow.connect(arbiter).resolveDispute(0, true),
      ).to.be.revertedWith("Isn't in dispute");
    });

    it("should revert if already resolved", async function () {
      await escrow.connect(arbiter).resolveDispute(0, true);

      await expect(
        escrow.connect(arbiter).resolveDispute(0, true),
      ).to.be.revertedWith("Isn't in dispute");
    });
  });
  describe("claimTimeout", function () {
    it("should refund buyer after deadline via claimTimeout", async function () {
      const amount = ethers.parseEther("1.0");

      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });

      const before = await ethers.provider.getBalance(buyer.address);

      await network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await network.provider.send("evm_mine");

      const tx = await escrow.connect(buyer).claimTimeout(0);
      const receipt = await tx.wait();

      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const after = await ethers.provider.getBalance(buyer.address);

      expect(after).to.be.closeTo(
        before + amount - gasUsed,
        ethers.parseEther("0.001"),
      );

      const data = await escrow.escrows(0);
      expect(data.state).to.equal(3); // REFUNDED
    });

    it("should revert claimTimeout if not expired", async function () {
      const amount = ethers.parseEther("1.0");

      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });

      await expect(escrow.connect(buyer).claimTimeout(0)).to.be.revertedWith(
        "Not expired",
      );
    });

    it("should revert claimTimeout if already processed", async function () {
      const amount = ethers.parseEther("1.0");

      await escrow
        .connect(buyer)
        .createEscrow(seller.address, arbiter.address, { value: amount });

      await network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await network.provider.send("evm_mine");

      await escrow.connect(buyer).claimTimeout(0);

      await expect(escrow.connect(buyer).claimTimeout(0)).to.be.revertedWith(
        "Invalid state",
      );
    });
  });

  describe("ownership", function () {
    it("should set deployer as owner", async function () {
      expect(await escrow.owner()).to.equal(buyer.address);
    });

    it("should transfer ownership", async function () {
      await escrow.connect(buyer).transferOwnership(seller.address);
      expect(await escrow.owner()).to.equal(seller.address);
    });

    it("should revert if non-owner transfers ownership", async function () {
      await expect(
        escrow.connect(seller).transferOwnership(arbiter.address),
      ).to.be.revertedWith("Only owner");
    });
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain Contract", function () {
  let supplyChain, pricing;
  let owner, farmer, transporter, wholesaler, retailer, government, addrs;

  // Use Ethers v6 syntax for keccak256
  const FARMER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FARMER_ROLE"));
  const TRANSPORTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TRANSPORTER_ROLE"));
  const WHOLESALER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("WHOLESALER_ROLE"));
  const RETAILER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RETAILER_ROLE"));
  const GOVERNMENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GOVERNMENT_ROLE"));

  beforeEach(async function () {
    [owner, farmer, transporter, wholesaler, retailer, government, ...addrs] = await ethers.getSigners();

    // Deploy Pricing contract
    const Pricing = await ethers.getContractFactory("Pricing");
    pricing = await Pricing.deploy();
    await pricing.waitForDeployment();

    // Deploy SupplyChain contract with Pricing address
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy(pricing.target);
    await supplyChain.waitForDeployment();

    // Grant roles
    await supplyChain.grantRole(FARMER_ROLE, farmer.address);
    await supplyChain.grantRole(TRANSPORTER_ROLE, transporter.address);
    await supplyChain.grantRole(WHOLESALER_ROLE, wholesaler.address);
    await supplyChain.grantRole(RETAILER_ROLE, retailer.address);
    await supplyChain.grantRole(GOVERNMENT_ROLE, government.address);

    await pricing.grantRole(GOVERNMENT_ROLE, government.address);
    await pricing.grantRole(WHOLESALER_ROLE, wholesaler.address);
    await pricing.grantRole(RETAILER_ROLE, retailer.address);
  });

  describe("Batch Registration", function () {
    it("Should allow farmer to register a batch", async function () {
      const tx = await supplyChain.connect(farmer).registerBatch(
        "Tomatoes",
        1000,
        Math.floor(Date.now() / 1000) - 86400,
        "Farm A",
        "A",
        "QmTestHash"
      );

      await expect(tx).to.emit(supplyChain, "BatchCreated").withArgs(1, farmer.address, "Tomatoes");

      const batch = await supplyChain.batches(1);
      expect(batch.batchId).to.equal(1);
      expect(batch.farmer).to.equal(farmer.address);
      expect(batch.produceType).to.equal("Tomatoes");
      expect(batch.status).to.equal(0); // REGISTERED
    });

    it("Should reject non-farmers from registering", async function () {
      await expect(
        supplyChain.connect(transporter).registerBatch(
          "Tomatoes",
          1000,
          Math.floor(Date.now() / 1000) - 86400,
          "Farm A",
          "A",
          "QmTestHash"
        )
      ).to.be.revertedWith(/AccessControl/);
    });
  });

  describe("Status Updates", function () {
    beforeEach(async function () {
      await supplyChain.connect(farmer).registerBatch(
        "Tomatoes",
        1000,
        Math.floor(Date.now() / 1000) - 86400,
        "Farm A",
        "A",
        "QmTestHash"
      );
    });

    it("Should allow transporter to update status to IN_TRANSIT", async function () {
      const tx = await supplyChain.connect(transporter).updateBatchStatus(1, 1);
      await expect(tx).to.emit(supplyChain, "BatchStatusUpdated").withArgs(1, 0, 1);
    });

    it("Should reject unauthorized status updates", async function () {
      await expect(
        supplyChain.connect(farmer).updateBatchStatus(1, 1)
      ).to.be.revertedWith("Not authorized for this status");
    });
  });

  describe("Pricing", function () {
    beforeEach(async function () {
      await supplyChain.connect(farmer).registerBatch(
        "Tomatoes",
        1000,
        Math.floor(Date.now() / 1000) - 86400,
        "Farm A",
        "A",
        "QmTestHash"
      );
    });

    it("Should allow wholesaler to set valid batch price", async function () {
      await pricing.connect(government).setFairPriceRange("Tomatoes", 1, 100);
      const tx = await supplyChain.connect(wholesaler).setBatchPrice(1, 10, 15);
      await expect(tx).to.emit(supplyChain, "BatchPriced").withArgs(1, 10, 15);
    });

    it("Should reject price exceeding fair range", async function () {
      await pricing.connect(government).setFairPriceRange("Tomatoes", 1, 50);
      await expect(
        supplyChain.connect(wholesaler).setBatchPrice(1, 10, 60)
      ).to.be.revertedWith("Price not valid");
    });
  });
});

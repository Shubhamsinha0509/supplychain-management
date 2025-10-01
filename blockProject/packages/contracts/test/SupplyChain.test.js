const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain Contract", function () {
  let supplyChain;
  let pricing;
  let owner;
  let farmer;
  let transporter;
  let wholesaler;
  let retailer;
  let government;
  let addrs;

  const FARMER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("FARMER_ROLE"));
  const TRANSPORTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TRANSPORTER_ROLE"));
  const WHOLESALER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("WHOLESALER_ROLE"));
  const RETAILER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("RETAILER_ROLE"));
  const GOVERNMENT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GOVERNMENT_ROLE"));

  beforeEach(async function () {
    [owner, farmer, transporter, wholesaler, retailer, government, ...addrs] = await ethers.getSigners();

    // Deploy SupplyChain contract
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy();
    await supplyChain.deployed();

    // Deploy Pricing contract
    const Pricing = await ethers.getContractFactory("Pricing");
    pricing = await Pricing.deploy();
    await pricing.deployed();

    // Setup roles
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
      const produceType = "Tomatoes";
      const quantity = 1000;
      const harvestDate = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
      const location = "Farm A, Region X";
      const qualityGrade = "A";
      const ipfsHash = "QmTestHash123";

      const tx = await supplyChain.connect(farmer).registerBatch(
        produceType,
        quantity,
        harvestDate,
        location,
        qualityGrade,
        ipfsHash
      );

      await expect(tx)
        .to.emit(supplyChain, "BatchCreated")
        .withArgs(1, farmer.address, produceType, quantity, ipfsHash);

      const batch = await supplyChain.getBatch(1);
      expect(batch.batchId).to.equal(1);
      expect(batch.farmer).to.equal(farmer.address);
      expect(batch.produceType).to.equal(produceType);
      expect(batch.quantity).to.equal(quantity);
      expect(batch.status).to.equal(0); // REGISTERED
    });

    it("Should reject batch registration with invalid data", async function () {
      await expect(
        supplyChain.connect(farmer).registerBatch(
          "Tomatoes",
          0, // Invalid quantity
          Math.floor(Date.now() / 1000),
          "Farm A",
          "A",
          "QmTestHash"
        )
      ).to.be.revertedWith("Quantity must be greater than 0");

      await expect(
        supplyChain.connect(farmer).registerBatch(
          "Tomatoes",
          1000,
          Math.floor(Date.now() / 1000) + 86400, // Future date
          "Farm A",
          "A",
          "QmTestHash"
        )
      ).to.be.revertedWith("Harvest date cannot be in the future");
    });

    it("Should reject batch registration from non-farmer", async function () {
      await expect(
        supplyChain.connect(transporter).registerBatch(
          "Tomatoes",
          1000,
          Math.floor(Date.now() / 1000),
          "Farm A",
          "A",
          "QmTestHash"
        )
      ).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Status Updates", function () {
    let batchId;

    beforeEach(async function () {
      // Register a batch first
      await supplyChain.connect(farmer).registerBatch(
        "Tomatoes",
        1000,
        Math.floor(Date.now() / 1000) - 86400,
        "Farm A",
        "A",
        "QmTestHash"
      );
      batchId = 1;
    });

    it("Should allow transporter to update status to IN_TRANSIT", async function () {
      const tx = await supplyChain.connect(transporter).updateBatchStatus(
        batchId,
        1, // IN_TRANSIT
        "Batch picked up for transport",
        "Transport Hub A",
        "QmTransportHash"
      );

      await expect(tx)
        .to.emit(supplyChain, "BatchStatusUpdated")
        .withArgs(batchId, 0, 1, transporter.address);

      const batch = await supplyChain.getBatch(batchId);
      expect(batch.status).to.equal(1); // IN_TRANSIT
    });

    it("Should allow wholesaler to receive batch", async function () {
      // First update to IN_TRANSIT
      await supplyChain.connect(transporter).updateBatchStatus(
        batchId,
        1,
        "Batch picked up",
        "Transport Hub",
        "QmHash1"
      );

      // Then update to AT_WHOLESALER
      const tx = await supplyChain.connect(wholesaler).updateBatchStatus(
        batchId,
        2, // AT_WHOLESALER
        "Batch received at wholesaler",
        "Wholesale Market",
        "QmWholesaleHash"
      );

      await expect(tx)
        .to.emit(supplyChain, "BatchStatusUpdated")
        .withArgs(batchId, 1, 2, wholesaler.address);

      const batch = await supplyChain.getBatch(batchId);
      expect(batch.status).to.equal(2); // AT_WHOLESALER
    });

    it("Should reject invalid status transitions", async function () {
      await expect(
        supplyChain.connect(transporter).updateBatchStatus(
          batchId,
          2, // AT_WHOLESALER (invalid transition from REGISTERED)
          "Invalid transition",
          "Location",
          "QmHash"
        )
      ).to.be.revertedWith("Invalid status transition");
    });

    it("Should reject unauthorized status updates", async function () {
      await expect(
        supplyChain.connect(farmer).updateBatchStatus(
          batchId,
          1, // IN_TRANSIT (farmer not authorized)
          "Unauthorized update",
          "Location",
          "QmHash"
        )
      ).to.be.revertedWith("Not authorized for this status");
    });
  });

  describe("Pricing", function () {
    let batchId;

    beforeEach(async function () {
      // Register a batch
      await supplyChain.connect(farmer).registerBatch(
        "Tomatoes",
        1000,
        Math.floor(Date.now() / 1000) - 86400,
        "Farm A",
        "A",
        "QmTestHash"
      );
      batchId = 1;
    });

    it("Should allow wholesaler to set batch price", async function () {
      const price = ethers.utils.parseEther("10");
      
      const tx = await supplyChain.connect(wholesaler).setBatchPrice(batchId, price);
      
      await expect(tx)
        .to.emit(supplyChain, "PriceSet")
        .withArgs(batchId, price, wholesaler.address);

      const batchPrice = await supplyChain.getBatchPrice(batchId);
      expect(batchPrice).to.equal(price);
    });

    it("Should allow government to set fair price range", async function () {
      const maxPrice = ethers.utils.parseEther("15");
      
      const tx = await supplyChain.connect(government).setFairPriceRange("Tomatoes", maxPrice);
      
      await expect(tx)
        .to.emit(supplyChain, "FairPriceRangeUpdated")
        .withArgs("Tomatoes", maxPrice);
    });

    it("Should reject price exceeding fair range", async function () {
      // Set fair price range
      const maxPrice = ethers.utils.parseEther("15");
      await supplyChain.connect(government).setFairPriceRange("Tomatoes", maxPrice);

      // Try to set price above fair range
      const highPrice = ethers.utils.parseEther("20");
      await expect(
        supplyChain.connect(wholesaler).setBatchPrice(batchId, highPrice)
      ).to.be.revertedWith("Price exceeds fair price range");
    });
  });

  describe("Batch Events", function () {
    let batchId;

    beforeEach(async function () {
      await supplyChain.connect(farmer).registerBatch(
        "Tomatoes",
        1000,
        Math.floor(Date.now() / 1000) - 86400,
        "Farm A",
        "A",
        "QmTestHash"
      );
      batchId = 1;
    });

    it("Should track batch events", async function () {
      // Update status to create event
      await supplyChain.connect(transporter).updateBatchStatus(
        batchId,
        1,
        "Batch picked up for transport",
        "Transport Hub",
        "QmTransportHash"
      );

      const events = await supplyChain.getBatchEvents(batchId);
      expect(events.length).to.equal(1);
      expect(events[0].eventType).to.equal("TRANSPORT_STARTED");
      expect(events[0].actor).to.equal(transporter.address);
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to grant roles", async function () {
      const newFarmer = addrs[0];
      
      await supplyChain.grantRole(FARMER_ROLE, newFarmer.address);
      
      const hasRole = await supplyChain.hasRole(FARMER_ROLE, newFarmer.address);
      expect(hasRole).to.be.true;
    });

    it("Should reject non-admin from granting roles", async function () {
      const newFarmer = addrs[0];
      
      await expect(
        supplyChain.connect(farmer).grantRole(FARMER_ROLE, newFarmer.address)
      ).to.be.revertedWith("AccessControl: account");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple batches correctly", async function () {
      // Register multiple batches
      await supplyChain.connect(farmer).registerBatch(
        "Tomatoes",
        1000,
        Math.floor(Date.now() / 1000) - 86400,
        "Farm A",
        "A",
        "QmHash1"
      );

      await supplyChain.connect(farmer).registerBatch(
        "Wheat",
        2000,
        Math.floor(Date.now() / 1000) - 172800,
        "Farm B",
        "B",
        "QmHash2"
      );

      const totalBatches = await supplyChain.getTotalBatches();
      expect(totalBatches).to.equal(2);

      const batch1 = await supplyChain.getBatch(1);
      const batch2 = await supplyChain.getBatch(2);
      
      expect(batch1.produceType).to.equal("Tomatoes");
      expect(batch2.produceType).to.equal("Wheat");
    });

    it("Should reject operations on non-existent batches", async function () {
      await expect(
        supplyChain.getBatch(999)
      ).to.be.revertedWith("Invalid batch ID");
    });
  });
});

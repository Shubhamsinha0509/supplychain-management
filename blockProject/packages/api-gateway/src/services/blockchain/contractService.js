const { ethers } = require('ethers');
const SupplyChainABI = require('../../../contracts/artifacts/contracts/SupplyChain.sol/SupplyChain.json');
const PricingABI = require('../../../contracts/artifacts/contracts/Pricing.sol/Pricing.json');

class ContractService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    // Contract addresses (set after deployment)
    this.supplyChainAddress = process.env.SUPPLY_CHAIN_CONTRACT_ADDRESS;
    this.pricingAddress = process.env.PRICING_CONTRACT_ADDRESS;
    
    // Contract instances
    this.supplyChainContract = new ethers.Contract(
      this.supplyChainAddress,
      SupplyChainABI.abi,
      this.wallet
    );
    
    this.pricingContract = new ethers.Contract(
      this.pricingAddress,
      PricingABI.abi,
      this.wallet
    );
  }

  /**
   * Register a new batch on the blockchain
   * @param {Object} batchData - Batch data to register
   * @returns {Promise<Object>} Transaction result
   */
  async registerBatch(batchData) {
    try {
      const {
        batchId,
        farmer,
        produceType,
        quantity,
        harvestDate,
        location,
        qualityGrade,
        ipfsHash
      } = batchData;

      const tx = await this.supplyChainContract.registerBatch(
        produceType,
        quantity,
        harvestDate,
        location,
        qualityGrade,
        ipfsHash
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.events
      };
    } catch (error) {
      console.error('Error registering batch on blockchain:', error);
      throw new Error(`Blockchain registration failed: ${error.message}`);
    }
  }

  /**
   * Update batch status on the blockchain
   * @param {number} batchId - Batch ID
   * @param {string} status - New status
   * @param {string} description - Status description
   * @param {string} location - Current location
   * @param {string} ipfsHash - IPFS hash for additional data
   * @returns {Promise<Object>} Transaction result
   */
  async updateBatchStatus(batchId, status, description, location, ipfsHash) {
    try {
      const statusMap = {
        'IN_TRANSIT': 1,
        'AT_WHOLESALER': 2,
        'AT_RETAILER': 3,
        'SOLD_TO_CONSUMER': 4
      };

      const statusValue = statusMap[status];
      if (statusValue === undefined) {
        throw new Error(`Invalid status: ${status}`);
      }

      const tx = await this.supplyChainContract.updateBatchStatus(
        batchId,
        statusValue,
        description,
        location,
        ipfsHash
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.events
      };
    } catch (error) {
      console.error('Error updating batch status on blockchain:', error);
      throw new Error(`Blockchain status update failed: ${error.message}`);
    }
  }

  /**
   * Set batch pricing on the blockchain
   * @param {number} batchId - Batch ID
   * @param {Object} pricing - Pricing information
   * @returns {Promise<Object>} Transaction result
   */
  async setBatchPricing(batchId, pricing) {
    try {
      const {
        farmGatePrice,
        wholesalePrice,
        retailPrice,
        transportCost
      } = pricing;

      const tx = await this.pricingContract.setBatchPricing(
        batchId,
        farmGatePrice,
        wholesalePrice,
        retailPrice,
        transportCost
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.events
      };
    } catch (error) {
      console.error('Error setting batch pricing on blockchain:', error);
      throw new Error(`Blockchain pricing update failed: ${error.message}`);
    }
  }

  /**
   * Set fair price range for a produce type
   * @param {string} produceType - Type of produce
   * @param {number} minPrice - Minimum fair price
   * @param {number} maxPrice - Maximum fair price
   * @returns {Promise<Object>} Transaction result
   */
  async setFairPriceRange(produceType, minPrice, maxPrice) {
    try {
      const tx = await this.pricingContract.setFairPriceRange(
        produceType,
        minPrice,
        maxPrice
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.events
      };
    } catch (error) {
      console.error('Error setting fair price range on blockchain:', error);
      throw new Error(`Blockchain fair price range update failed: ${error.message}`);
    }
  }

  /**
   * Get batch information from blockchain
   * @param {number} batchId - Batch ID
   * @returns {Promise<Object>} Batch information
   */
  async getBatch(batchId) {
    try {
      const batch = await this.supplyChainContract.getBatch(batchId);
      
      return {
        success: true,
        data: {
          batchId: batch.batchId.toString(),
          farmer: batch.farmer,
          produceType: batch.produceType,
          quantity: batch.quantity.toString(),
          harvestDate: batch.harvestDate.toString(),
          location: batch.location,
          qualityGrade: batch.qualityGrade,
          status: batch.status,
          createdAt: batch.createdAt.toString(),
          updatedAt: batch.updatedAt.toString(),
          ipfsHash: batch.ipfsHash,
          isActive: batch.isActive
        }
      };
    } catch (error) {
      console.error('Error fetching batch from blockchain:', error);
      throw new Error(`Blockchain batch fetch failed: ${error.message}`);
    }
  }

  /**
   * Get batch events from blockchain
   * @param {number} batchId - Batch ID
   * @returns {Promise<Object>} Batch events
   */
  async getBatchEvents(batchId) {
    try {
      const events = await this.supplyChainContract.getBatchEvents(batchId);
      
      return {
        success: true,
        data: events.map(event => ({
          eventId: event.eventId.toString(),
          batchId: event.batchId.toString(),
          actor: event.actor,
          eventType: event.eventType,
          description: event.description,
          timestamp: event.timestamp.toString(),
          location: event.location,
          ipfsHash: event.ipfsHash
        }))
      };
    } catch (error) {
      console.error('Error fetching batch events from blockchain:', error);
      throw new Error(`Blockchain events fetch failed: ${error.message}`);
    }
  }

  /**
   * Get batch pricing from blockchain
   * @param {number} batchId - Batch ID
   * @returns {Promise<Object>} Batch pricing
   */
  async getBatchPricing(batchId) {
    try {
      const pricing = await this.pricingContract.getBatchPricing(batchId);
      
      return {
        success: true,
        data: {
          farmGatePrice: pricing.farmGatePrice.toString(),
          wholesalePrice: pricing.wholesalePrice.toString(),
          retailPrice: pricing.retailPrice.toString(),
          transportCost: pricing.transportCost.toString(),
          margin: pricing.margin.toString(),
          timestamp: pricing.timestamp.toString(),
          setter: pricing.setter
        }
      };
    } catch (error) {
      console.error('Error fetching batch pricing from blockchain:', error);
      throw new Error(`Blockchain pricing fetch failed: ${error.message}`);
    }
  }

  /**
   * Check if pricing is fair
   * @param {number} batchId - Batch ID
   * @param {string} produceType - Type of produce
   * @returns {Promise<Object>} Fair pricing check result
   */
  async checkFairPricing(batchId, produceType) {
    try {
      const result = await this.pricingContract.checkFairPricing(batchId, produceType);
      
      return {
        success: true,
        data: {
          isFair: result.isFair,
          violationType: result.violationType
        }
      };
    } catch (error) {
      console.error('Error checking fair pricing on blockchain:', error);
      throw new Error(`Blockchain fair pricing check failed: ${error.message}`);
    }
  }

  /**
   * Listen to blockchain events
   * @param {string} eventName - Event name to listen for
   * @param {Function} callback - Callback function
   */
  async listenToEvents(eventName, callback) {
    try {
      this.supplyChainContract.on(eventName, callback);
    } catch (error) {
      console.error('Error setting up event listener:', error);
      throw new Error(`Event listener setup failed: ${error.message}`);
    }
  }

  /**
   * Get contract events with filters
   * @param {string} eventName - Event name
   * @param {Object} filters - Event filters
   * @param {number} fromBlock - Starting block number
   * @param {number} toBlock - Ending block number
   * @returns {Promise<Object>} Filtered events
   */
  async getEvents(eventName, filters = {}, fromBlock = 0, toBlock = 'latest') {
    try {
      const events = await this.supplyChainContract.queryFilter(
        this.supplyChainContract.filters[eventName](...Object.values(filters)),
        fromBlock,
        toBlock
      );
      
      return {
        success: true,
        data: events.map(event => ({
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          args: event.args,
          timestamp: event.timestamp
        }))
      };
    } catch (error) {
      console.error('Error fetching events from blockchain:', error);
      throw new Error(`Blockchain events fetch failed: ${error.message}`);
    }
  }

  /**
   * Estimate gas for a transaction
   * @param {string} method - Contract method name
   * @param {Array} params - Method parameters
   * @returns {Promise<Object>} Gas estimate
   */
  async estimateGas(method, params) {
    try {
      const gasEstimate = await this.supplyChainContract.estimateGas[method](...params);
      
      return {
        success: true,
        gasEstimate: gasEstimate.toString(),
        gasPrice: (await this.provider.getGasPrice()).toString()
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }
}

module.exports = ContractService;

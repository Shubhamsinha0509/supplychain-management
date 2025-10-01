const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { ethers } = require('ethers');

// @route   POST /api/batches
// @desc    Register a new batch
// @access  Private (Farmer only)
router.post('/', [
  auth,
  [
    body('produceType').notEmpty().withMessage('Produce type is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('harvestDate').isISO8601().withMessage('Valid harvest date is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('qualityGrade').isIn(['A', 'B', 'C', 'Organic', 'Premium', 'Standard']).withMessage('Invalid quality grade'),
    body('ipfsHash').notEmpty().withMessage('IPFS hash is required')
  ]
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is a farmer
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ msg: 'Only farmers can register batches' });
    }

    const {
      produceType,
      variety,
      quantity,
      unit,
      harvestDate,
      location,
      qualityGrade,
      qualityScore,
      ipfsHash,
      ipfsMetadata,
      farmLocation,
      plantingDate,
      expectedShelfLife
    } = req.body;

    // Get next batch ID
    const lastBatch = await Batch.findOne().sort({ batchId: -1 });
    const batchId = lastBatch ? lastBatch.batchId + 1 : 1;

    // Create batch object
    const batchData = {
      batchId,
      farmer: req.user.id,
      produceType,
      variety,
      quantity,
      unit: unit || 'kg',
      harvestDate: new Date(harvestDate),
      qualityGrade,
      qualityScore,
      ipfsHash,
      ipfsMetadata,
      farmLocation: {
        ...farmLocation,
        coordinates: farmLocation?.coordinates || null
      },
      plantingDate: plantingDate ? new Date(plantingDate) : null,
      expectedShelfLife
    };

    // Create batch in database
    const batch = new Batch(batchData);
    await batch.save();

    // Add initial event
    await batch.addEvent({
      eventType: 'REGISTERED',
      actor: req.user.id,
      description: 'Batch registered by farmer',
      location: {
        name: farmLocation?.name || 'Farm',
        address: location,
        coordinates: farmLocation?.coordinates || null
      }
    });

    // TODO: Deploy to blockchain
    // const contractResult = await deployToBlockchain(batch);

    res.status(201).json({
      success: true,
      data: {
        batchId: batch.batchId,
        batch: batch,
        message: 'Batch registered successfully'
      }
    });

  } catch (error) {
    console.error('Error registering batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/batches
// @desc    Get all batches with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      produceType,
      farmer,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (status) filter.blockchainStatus = status;
    if (produceType) filter.produceType = new RegExp(produceType, 'i');
    if (farmer) filter.farmer = farmer;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const batches = await Batch.find(filter)
      .populate('farmer', 'firstName lastName email businessInfo.businessName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-ipfsMetadata -events -qualityChecks');

    const total = await Batch.countDocuments(filter);

    res.json({
      success: true,
      data: {
        batches,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/batches/:batchId
// @desc    Get batch by ID with full details
// @access  Private
router.get('/:batchId', auth, async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId, isActive: true })
      .populate('farmer', 'firstName lastName email businessInfo.businessName')
      .populate('events.actor', 'firstName lastName role')
      .populate('qualityChecks.performedBy', 'firstName lastName role');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: batch
    });

  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/batches/:batchId/status
// @desc    Update batch status
// @access  Private (Authorized roles only)
router.put('/:batchId/status', [
  auth,
  [
    body('status').isIn(['IN_TRANSIT', 'AT_WHOLESALER', 'AT_RETAILER', 'SOLD_TO_CONSUMER']).withMessage('Invalid status'),
    body('description').notEmpty().withMessage('Description is required'),
    body('location').notEmpty().withMessage('Location is required')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const batch = await Batch.findOne({ batchId: req.params.batchId, isActive: true });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check authorization based on status
    const { status, description, location, coordinates, ipfsHash } = req.body;
    
    if (!isAuthorizedForStatus(req.user.role, status)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update to this status'
      });
    }

    // Update batch status
    await batch.updateStatus(status, req.user.id, description, {
      name: location,
      coordinates: coordinates || null
    });

    // TODO: Update blockchain status
    // await updateBlockchainStatus(batch.batchId, status);

    res.json({
      success: true,
      data: batch,
      message: 'Batch status updated successfully'
    });

  } catch (error) {
    console.error('Error updating batch status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/batches/:batchId/pricing
// @desc    Set batch pricing
// @access  Private (Wholesaler/Retailer only)
router.put('/:batchId/pricing', [
  auth,
  [
    body('farmGatePrice').isNumeric().withMessage('Farm gate price must be a number'),
    body('wholesalePrice').isNumeric().withMessage('Wholesale price must be a number'),
    body('retailPrice').isNumeric().withMessage('Retail price must be a number'),
    body('transportCost').optional().isNumeric().withMessage('Transport cost must be a number')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is authorized to set pricing
    if (!['wholesaler', 'retailer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only wholesalers and retailers can set pricing'
      });
    }

    const batch = await Batch.findOne({ batchId: req.params.batchId, isActive: true });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const {
      farmGatePrice,
      wholesalePrice,
      retailPrice,
      transportCost = 0,
      currency = 'USD'
    } = req.body;

    // Validate pricing logic
    if (wholesalePrice < farmGatePrice) {
      return res.status(400).json({
        success: false,
        message: 'Wholesale price must be greater than or equal to farm gate price'
      });
    }

    if (retailPrice < wholesalePrice) {
      return res.status(400).json({
        success: false,
        message: 'Retail price must be greater than or equal to wholesale price'
      });
    }

    // Update pricing
    batch.pricing = {
      farmGatePrice,
      wholesalePrice,
      retailPrice,
      transportCost,
      margin: retailPrice - farmGatePrice,
      currency
    };

    // Add price history entry
    batch.pricing.priceHistory.push({
      price: retailPrice,
      priceType: 'retail',
      setBy: req.user.id,
      setAt: new Date(),
      reason: 'Price set by ' + req.user.role
    });

    await batch.save();

    // TODO: Update blockchain pricing
    // await updateBlockchainPricing(batch.batchId, pricing);

    res.json({
      success: true,
      data: batch,
      message: 'Pricing updated successfully'
    });

  } catch (error) {
    console.error('Error updating pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/batches/:batchId/quality-check
// @desc    Add quality check to batch
// @access  Private (Authorized roles only)
router.post('/:batchId/quality-check', [
  auth,
  [
    body('checkType').isIn(['visual', 'chemical', 'microbiological', 'sensory']).withMessage('Invalid check type'),
    body('results.passed').isBoolean().withMessage('Passed status is required'),
    body('results.score').isNumeric().withMessage('Score must be a number')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const batch = await Batch.findOne({ batchId: req.params.batchId, isActive: true });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const qualityCheckData = {
      checkType: req.body.checkType,
      performedBy: req.user.id,
      results: req.body.results,
      certificateHash: req.body.certificateHash
    };

    await batch.addQualityCheck(qualityCheckData);

    res.json({
      success: true,
      data: batch,
      message: 'Quality check added successfully'
    });

  } catch (error) {
    console.error('Error adding quality check:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/batches/:batchId/history
// @desc    Get complete batch history
// @access  Private
router.get('/:batchId/history', auth, async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId, isActive: true })
      .populate('events.actor', 'firstName lastName role')
      .populate('qualityChecks.performedBy', 'firstName lastName role')
      .select('events qualityChecks pricing stats');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: {
        events: batch.events,
        qualityChecks: batch.qualityChecks,
        pricing: batch.pricing,
        stats: batch.stats
      }
    });

  } catch (error) {
    console.error('Error fetching batch history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Helper function to check authorization for status updates
function isAuthorizedForStatus(userRole, status) {
  const authorizationMap = {
    'IN_TRANSIT': ['transporter'],
    'AT_WHOLESALER': ['wholesaler'],
    'AT_RETAILER': ['retailer'],
    'SOLD_TO_CONSUMER': ['retailer']
  };

  return authorizationMap[status]?.includes(userRole) || false;
}

module.exports = router;

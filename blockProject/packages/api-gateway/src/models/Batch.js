const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  // Basic Information
  batchId: {
    type: Number,
    required: true,
    unique: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Produce Information
  produceType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  variety: {
    type: String,
    trim: true,
    maxlength: 100
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'lb', 'ton', 'pieces', 'boxes', 'bags'],
    default: 'kg'
  },
  
  // Quality Information
  qualityGrade: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'Organic', 'Premium', 'Standard']
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  qualityCertifications: [{
    name: String,
    issuer: String,
    certificateNumber: String,
    issueDate: Date,
    expiryDate: Date,
    ipfsHash: String
  }],
  
  // Location Information
  farmLocation: {
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    farmSize: Number, // in acres/hectares
    soilType: String,
    climateZone: String
  },
  
  // Timing Information
  harvestDate: {
    type: Date,
    required: true
  },
  plantingDate: Date,
  expectedShelfLife: Number, // in days
  actualShelfLife: Number, // in days
  
  // Blockchain Information
  blockchainStatus: {
    type: String,
    enum: ['REGISTERED', 'IN_TRANSIT', 'AT_WHOLESALER', 'AT_RETAILER', 'SOLD_TO_CONSUMER'],
    default: 'REGISTERED'
  },
  contractAddress: String,
  transactionHash: String,
  blockNumber: Number,
  gasUsed: Number,
  
  // IPFS Information
  ipfsHash: {
    type: String,
    required: true
  },
  ipfsMetadata: {
    images: [String], // Array of IPFS hashes for images
    documents: [String], // Array of IPFS hashes for documents
    videos: [String], // Array of IPFS hashes for videos
    certificates: [String] // Array of IPFS hashes for certificates
  },
  
  // Pricing Information
  pricing: {
    farmGatePrice: Number, // Price paid to farmer
    wholesalePrice: Number, // Price at wholesaler
    retailPrice: Number, // Final retail price
    transportCost: Number, // Transportation cost
    margin: Number, // Total margin
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'INR', 'GBP']
    },
    priceHistory: [{
      price: Number,
      priceType: String, // 'farm_gate', 'wholesale', 'retail'
      setBy: mongoose.Schema.Types.ObjectId,
      setAt: Date,
      reason: String
    }]
  },
  
  // Supply Chain Events
  events: [{
    eventId: Number,
    eventType: {
      type: String,
      enum: ['REGISTERED', 'TRANSPORT_STARTED', 'RECEIVED_BY_WHOLESALER', 
             'RECEIVED_BY_RETAILER', 'SOLD_TO_CONSUMER', 'QUALITY_CHECKED',
             'PRICE_SET', 'CERTIFICATION_ADDED']
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String,
    location: {
      name: String,
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipfsHash: String, // Additional data stored on IPFS
    metadata: {
      temperature: Number,
      humidity: Number,
      storageConditions: String,
      handlingNotes: String
    }
  }],
  
  // Quality Tracking
  qualityChecks: [{
    checkType: {
      type: String,
      enum: ['visual', 'chemical', 'microbiological', 'sensory']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: Date,
    results: {
      passed: Boolean,
      score: Number,
      notes: String,
      parameters: [{
        name: String,
        value: Number,
        unit: String,
        standard: String,
        status: String // 'pass', 'fail', 'warning'
      }]
    },
    certificateHash: String
  }],
  
  // Current Status
  currentLocation: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    lastUpdated: Date
  },
  
  // Status Flags
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isRecalled: {
    type: Boolean,
    default: false
  },
  recallReason: String,
  
  // Statistics
  stats: {
    totalEvents: { type: Number, default: 0 },
    totalQualityChecks: { type: Number, default: 0 },
    averageQualityScore: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 }, // Total distance traveled
    timeInTransit: { type: Number, default: 0 }, // Total time in transit (hours)
    shelfLifeRemaining: { type: Number, default: 0 } // Days remaining
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
batchSchema.index({ batchId: 1 });
batchSchema.index({ farmer: 1 });
batchSchema.index({ produceType: 1 });
batchSchema.index({ blockchainStatus: 1 });
batchSchema.index({ 'farmLocation.coordinates': '2dsphere' });
batchSchema.index({ harvestDate: 1 });
batchSchema.index({ createdAt: -1 });
batchSchema.index({ isActive: 1 });

// Compound indexes
batchSchema.index({ farmer: 1, createdAt: -1 });
batchSchema.index({ produceType: 1, blockchainStatus: 1 });
batchSchema.index({ 'pricing.retailPrice': 1, produceType: 1 });

// Virtual for current status
batchSchema.virtual('currentStatus').get(function() {
  return this.blockchainStatus;
});

// Virtual for total events
batchSchema.virtual('totalEvents').get(function() {
  return this.events.length;
});

// Virtual for days since harvest
batchSchema.virtual('daysSinceHarvest').get(function() {
  const now = new Date();
  const harvest = new Date(this.harvestDate);
  return Math.floor((now - harvest) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update timestamps
batchSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update stats
  this.stats.totalEvents = this.events.length;
  this.stats.totalQualityChecks = this.qualityChecks.length;
  
  if (this.qualityChecks.length > 0) {
    const totalScore = this.qualityChecks.reduce((sum, check) => sum + (check.results.score || 0), 0);
    this.stats.averageQualityScore = totalScore / this.qualityChecks.length;
  }
  
  next();
});

// Instance method to add event
batchSchema.methods.addEvent = function(eventData) {
  this.events.push({
    ...eventData,
    timestamp: new Date()
  });
  this.stats.totalEvents = this.events.length;
  return this.save();
};

// Instance method to update status
batchSchema.methods.updateStatus = function(newStatus, actor, description, location) {
  this.blockchainStatus = newStatus;
  this.addEvent({
    eventType: newStatus,
    actor: actor,
    description: description,
    location: location
  });
  return this.save();
};

// Instance method to add quality check
batchSchema.methods.addQualityCheck = function(checkData) {
  this.qualityChecks.push({
    ...checkData,
    performedAt: new Date()
  });
  this.stats.totalQualityChecks = this.qualityChecks.length;
  return this.save();
};

// Static method to find by status
batchSchema.statics.findByStatus = function(status) {
  return this.find({ blockchainStatus: status, isActive: true });
};

// Static method to find by farmer
batchSchema.statics.findByFarmer = function(farmerId) {
  return this.find({ farmer: farmerId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to get batch statistics
batchSchema.statics.getBatchStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$blockchainStatus',
        count: { $sum: 1 },
        avgQualityScore: { $avg: '$stats.averageQualityScore' }
      }
    }
  ]);
};

// Static method to find batches by location
batchSchema.statics.findByLocation = function(coordinates, maxDistance = 10000) {
  return this.find({
    'farmLocation.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true
  });
};

module.exports = mongoose.model('Batch', batchSchema);

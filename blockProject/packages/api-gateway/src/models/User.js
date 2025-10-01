const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  
  // Profile Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    required: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: ['farmer', 'transporter', 'wholesaler', 'retailer', 'consumer', 'government', 'admin'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Blockchain Information
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid Ethereum address']
  },
  privateKey: {
    type: String,
    required: true,
    select: false // Never include in queries
  },
  
  // Business Information (varies by role)
  businessInfo: {
    businessName: String,
    businessType: String,
    registrationNumber: String,
    taxId: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    licenseNumbers: [String],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      certificateHash: String // IPFS hash
    }]
  },
  
  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'hi', 'zh']
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    units: {
      weight: { type: String, default: 'kg', enum: ['kg', 'lb', 'ton'] },
      distance: { type: String, default: 'km', enum: ['km', 'mi'] },
      currency: { type: String, default: 'USD', enum: ['USD', 'EUR', 'INR', 'GBP'] }
    }
  },
  
  // Statistics
  stats: {
    totalBatches: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    lastActive: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'businessInfo.address.coordinates': '2dsphere' });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role,
    walletAddress: this.walletAddress
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.stats.lastActive = new Date();
  return this.save();
};

// Static method to find by wallet address
userSchema.statics.findByWalletAddress = function(address) {
  return this.findOne({ walletAddress: address.toLowerCase() });
};

// Static method to find by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to get user statistics
userSchema.statics.getUserStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        avgRating: { $avg: '$stats.rating' }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema);

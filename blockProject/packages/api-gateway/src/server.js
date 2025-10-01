const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 4050;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Blockchain Supply Chain API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mock API routes
app.get('/api/batches', (req, res) => {
  const mockBatches = [
    {
      id: 1,
      batchId: 'BCH001',
      produceType: 'Tomatoes',
      quantity: 1000,
      status: 'REGISTERED',
      harvestDate: '2024-01-15',
      location: 'Farm A, California',
      qualityGrade: 'A',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      batchId: 'BCH002',
      produceType: 'Wheat',
      quantity: 2000,
      status: 'IN_TRANSIT',
      harvestDate: '2024-01-10',
      location: 'Transport Hub',
      qualityGrade: 'B',
      createdAt: '2024-01-10T08:00:00Z'
    }
  ];
  
  res.json({
    success: true,
    data: mockBatches
  });
});

app.get('/api/batches/:id', (req, res) => {
  const batchId = req.params.id;
  const mockBatch = {
    id: parseInt(batchId),
    batchId: 'BCH001',
    produceType: 'Tomatoes',
    quantity: 1000,
    status: 'IN_TRANSIT',
    harvestDate: '2024-01-15',
    location: 'Transport Hub, California',
    qualityGrade: 'A',
    farmer: 'John Doe',
    pricing: {
      farmGatePrice: 2.50,
      wholesalePrice: 3.20,
      retailPrice: 4.50,
      currency: 'USD'
    },
    events: [
      {
        id: 1,
        type: 'REGISTERED',
        description: 'Batch registered by farmer',
        timestamp: '2024-01-15T10:00:00Z',
        location: 'Farm A, California',
        actor: 'John Doe'
      },
      {
        id: 2,
        type: 'IN_TRANSIT',
        description: 'Batch picked up for transport',
        timestamp: '2024-01-16T08:00:00Z',
        location: 'Transport Hub, California',
        actor: 'Transport Co.'
      }
    ]
  };
  
  res.json({
    success: true,
    data: mockBatch
  });
});

app.post('/api/batches', (req, res) => {
  const { produceType, quantity, harvestDate, location, qualityGrade } = req.body;
  
  const newBatch = {
    id: Math.floor(Math.random() * 1000) + 1,
    batchId: `BCH${String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0')}`,
    produceType,
    quantity,
    status: 'REGISTERED',
    harvestDate,
    location,
    qualityGrade,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: newBatch,
    message: 'Batch created successfully'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API docs: http://localhost:${PORT}/api/batches`);
});

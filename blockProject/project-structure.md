# BLOCKCHAIN SUPPLY-CHAIN PROJECT STRUCTURE

## ROOT DIRECTORY STRUCTURE
```
supply-chain-blockchain/
├── README.md
├── package.json                    # Root package.json for workspace management
├── .gitignore
├── .env.example
├── docker-compose.yml              # Local development environment
├── docker-compose.prod.yml         # Production environment
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Continuous Integration
│       ├── deploy.yml              # Deployment pipeline
│       └── security-scan.yml       # Security scanning
├── docs/                           # Documentation
│   ├── api/                        # API documentation
│   ├── architecture/               # Architecture diagrams
│   ├── deployment/                 # Deployment guides
│   └── user-guides/                # User documentation
├── scripts/                        # Deployment and utility scripts
│   ├── deploy/
│   ├── setup/
│   └── maintenance/
└── packages/                       # Monorepo packages
    ├── contracts/                  # Smart contracts
    ├── api-gateway/                # Express.js API Gateway
    ├── web-dashboard/              # React/Next.js web app
    ├── mobile-app/                 # React Native mobile app
    ├── government-portal/          # Government monitoring portal
    ├── shared/                     # Shared utilities and types
    └── qr-service/                 # QR code generation service
```

## PACKAGE STRUCTURES

### 1. Smart Contracts (`packages/contracts/`)
```
contracts/
├── package.json
├── hardhat.config.js
├── .env.example
├── contracts/
│   ├── SupplyChain.sol             # Main supply chain contract
│   ├── Pricing.sol                 # Fair pricing contract
│   ├── Quality.sol                 # Quality certification contract
│   ├── AccessControl.sol           # Role-based access control
│   ├── interfaces/
│   │   ├── ISupplyChain.sol
│   │   ├── IPricing.sol
│   │   └── IQuality.sol
│   └── libraries/
│       ├── SupplyChainLib.sol
│       └── PricingLib.sol
├── test/
│   ├── SupplyChain.test.js
│   ├── Pricing.test.js
│   ├── Quality.test.js
│   └── integration/
│       └── EndToEnd.test.js
├── scripts/
│   ├── deploy.js
│   ├── verify.js
│   └── upgrade.js
├── deployments/                    # Deployment artifacts
└── artifacts/                      # Compiled contracts
```

### 2. API Gateway (`packages/api-gateway/`)
```
api-gateway/
├── package.json
├── .env.example
├── src/
│   ├── app.js                      # Express app setup
│   ├── server.js                   # Server entry point
│   ├── config/
│   │   ├── database.js
│   │   ├── blockchain.js
│   │   └── redis.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── rateLimiting.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── batches.js
│   │   ├── logistics.js
│   │   ├── pricing.js
│   │   └── quality.js
│   ├── services/
│   │   ├── blockchain/
│   │   │   ├── contractService.js
│   │   │   └── eventService.js
│   │   ├── database/
│   │   │   ├── batchService.js
│   │   │   ├── userService.js
│   │   │   └── eventService.js
│   │   └── external/
│   │       ├── ipfsService.js
│   │       └── qrService.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Batch.js
│   │   ├── Event.js
│   │   └── Quality.js
│   ├── utils/
│   │   ├── encryption.js
│   │   ├── validation.js
│   │   └── helpers.js
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
├── docs/                           # API documentation
└── logs/                           # Application logs
```

### 3. Web Dashboard (`packages/web-dashboard/`)
```
web-dashboard/
├── package.json
├── next.config.js
├── tailwind.config.js
├── .env.local.example
├── public/
│   ├── images/
│   ├── icons/
│   └── qr-templates/
├── src/
│   ├── pages/
│   │   ├── index.js                # Landing page
│   │   ├── auth/
│   │   │   ├── login.js
│   │   │   └── register.js
│   │   ├── farmer/
│   │   │   ├── dashboard.js
│   │   │   ├── register-produce.js
│   │   │   └── batch-history.js
│   │   ├── consumer/
│   │   │   ├── scan-qr.js
│   │   │   ├── product-history.js
│   │   │   └── verify-authenticity.js
│   │   ├── government/
│   │   │   ├── monitoring.js
│   │   │   ├── analytics.js
│   │   │   └── compliance.js
│   │   └── api/                    # API routes
│   │       ├── auth.js
│   │       └── batches.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.js
│   │   │   ├── Footer.js
│   │   │   ├── Navigation.js
│   │   │   └── QRScanner.js
│   │   ├── farmer/
│   │   │   ├── ProduceForm.js
│   │   │   ├── BatchCard.js
│   │   │   └── QRGenerator.js
│   │   ├── consumer/
│   │   │   ├── ProductHistory.js
│   │   │   ├── Timeline.js
│   │   │   └── Verification.js
│   │   └── government/
│   │       ├── Analytics.js
│   │       ├── Compliance.js
│   │       └── Monitoring.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useBlockchain.js
│   │   └── useQR.js
│   ├── services/
│   │   ├── api.js
│   │   ├── blockchain.js
│   │   └── qr.js
│   ├── utils/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── formatting.js
│   ├── styles/
│   │   ├── globals.css
│   │   └── components.css
│   └── types/
│       ├── user.ts
│       ├── batch.ts
│       └── api.ts
├── tests/
│   ├── components/
│   ├── pages/
│   └── utils/
└── docs/                           # Component documentation
```

### 4. Mobile App (`packages/mobile-app/`)
```
mobile-app/
├── package.json
├── app.json
├── babel.config.js
├── metro.config.js
├── .env.example
├── src/
│   ├── App.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   ├── AuthNavigator.js
│   │   └── TabNavigator.js
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── farmer/
│   │   │   ├── DashboardScreen.js
│   │   │   ├── RegisterProduceScreen.js
│   │   │   └── BatchHistoryScreen.js
│   │   ├── consumer/
│   │   │   ├── ScanQRScreen.js
│   │   │   ├── ProductHistoryScreen.js
│   │   │   └── VerifyScreen.js
│   │   └── common/
│   │       ├── ProfileScreen.js
│   │       └── SettingsScreen.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.js
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   └── QRScanner.js
│   │   ├── farmer/
│   │   │   ├── ProduceForm.js
│   │   │   └── BatchCard.js
│   │   └── consumer/
│   │       ├── ProductCard.js
│   │       └── Timeline.js
│   ├── services/
│   │   ├── api.js
│   │   ├── blockchain.js
│   │   ├── qr.js
│   │   └── storage.js
│   ├── utils/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── helpers.js
│   └── hooks/
│       ├── useAuth.js
│       ├── useQR.js
│       └── useOffline.js
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── android/                        # Android-specific files
├── ios/                           # iOS-specific files
└── tests/
    ├── components/
    ├── screens/
    └── utils/
```

### 5. Shared Package (`packages/shared/`)
```
shared/
├── package.json
├── src/
│   ├── types/
│   │   ├── user.ts
│   │   ├── batch.ts
│   │   ├── event.ts
│   │   ├── pricing.ts
│   │   └── quality.ts
│   ├── constants/
│   │   ├── roles.ts
│   │   ├── status.ts
│   │   ├── events.ts
│   │   └── config.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── encryption.ts
│   │   └── blockchain.ts
│   ├── schemas/
│   │   ├── user.schema.ts
│   │   ├── batch.schema.ts
│   │   └── event.schema.ts
│   └── interfaces/
│       ├── api.ts
│       ├── blockchain.ts
│       └── qr.ts
└── tests/
    ├── types/
    ├── utils/
    └── schemas/
```

## NAMING CONVENTIONS

### File Naming
- **Components**: PascalCase (e.g., `BatchCard.js`, `QRScanner.js`)
- **Utilities**: camelCase (e.g., `formatDate.js`, `validateInput.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.js`, `USER_ROLES.js`)
- **Types/Interfaces**: PascalCase with descriptive names (e.g., `BatchInfo.ts`, `UserProfile.ts`)

### Variable Naming
- **JavaScript/TypeScript**: camelCase
- **Solidity**: camelCase for functions/variables, PascalCase for contracts
- **Database**: snake_case for fields, PascalCase for models
- **API Routes**: kebab-case (e.g., `/api/batch-history`)

### Database Naming
- **Collections**: Plural, snake_case (e.g., `users`, `batch_events`)
- **Fields**: snake_case (e.g., `created_at`, `batch_id`)
- **Indexes**: Descriptive names (e.g., `idx_batch_id_created_at`)

### API Endpoint Naming
- **RESTful**: Resource-based (e.g., `GET /api/batches`, `POST /api/batches`)
- **Actions**: Verb-based (e.g., `POST /api/batches/{id}/verify`)
- **Versioning**: URL path versioning (e.g., `/api/v1/batches`)

### Smart Contract Naming
- **Contracts**: PascalCase (e.g., `SupplyChain`, `PricingContract`)
- **Functions**: camelCase (e.g., `createBatch`, `updateStatus`)
- **Events**: PascalCase (e.g., `BatchCreated`, `StatusUpdated`)
- **Modifiers**: camelCase with descriptive names (e.g., `onlyFarmer`, `validBatchId`)

## ENVIRONMENT CONFIGURATION

### Development Environment
```bash
# Root .env
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/supply-chain-dev
REDIS_URL=redis://localhost:6379
BLOCKCHAIN_NETWORK=hardhat
CONTRACT_ADDRESS=0x...
```

### Production Environment
```bash
# Production .env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
REDIS_URL=redis://...
BLOCKCHAIN_NETWORK=mainnet
CONTRACT_ADDRESS=0x...
```

## DEPLOYMENT STRUCTURE

### Docker Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  api-gateway:
    build: ./packages/api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
  
  web-dashboard:
    build: ./packages/web-dashboard
    ports:
      - "3001:3000"
    depends_on:
      - api-gateway
  
  mobile-app:
    # React Native doesn't run in Docker for development
    # Use Expo or direct device testing
  
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
  
  redis:
    image: redis:latest
    ports:
      - "6379:6379"
  
  ipfs:
    image: ipfs/go-ipfs:latest
    ports:
      - "4001:4001"
      - "5001:5001"
```

This structure provides:
- **Modularity**: Each package is independent but shares common utilities
- **Scalability**: Easy to add new services or modify existing ones
- **Maintainability**: Clear separation of concerns and consistent naming
- **Deployment**: Docker-ready with environment-specific configurations
- **Testing**: Comprehensive test structure for each package
- **Documentation**: Built-in documentation for each component

# 🌾 AgriChain - Blockchain Supply Chain Application

A comprehensive blockchain-based supply chain tracking system for agricultural produce, ensuring transparency, fair pricing, and quality assurance from farm to consumer.

## 🚀 Features

- **Complete Supply Chain Tracking**: Monitor produce from farm to consumer
- **QR Code Integration**: Easy scanning and verification at each stage
- **Fair Pricing Enforcement**: Blockchain-based pricing rules
- **Quality Assurance**: Track quality grades and certifications
- **Role-Based Access**: Different interfaces for farmers, transporters, wholesalers, retailers, and consumers
- **Government Portal**: Monitoring and oversight capabilities
- **IPFS Integration**: Decentralized file storage for certificates and documents

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React.js with Vite and Tailwind CSS
- **Backend**: Node.js with Express
- **Blockchain**: Solidity smart contracts on Ethereum
- **Database**: MongoDB for off-chain data
- **File Storage**: IPFS for large files
- **Development**: Hardhat for smart contract development

### Components
- **Smart Contracts**: Supply chain logic and fair pricing
- **API Gateway**: RESTful API for frontend communication
- **Web Dashboard**: React-based user interface
- **QR Service**: QR code generation and scanning
- **Mobile App**: React Native (planned)

## 📁 Project Structure

```
supply-chain-blockchain/
├── packages/
│   ├── contracts/          # Solidity smart contracts
│   ├── api-gateway/        # Node.js/Express backend
│   ├── web-dashboard/      # React frontend
│   └── qr-service/         # QR code utilities
├── docker-compose.yml      # Development environment
├── nginx.conf              # Production reverse proxy
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm
- Docker Desktop
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/sujalmFilterit/blockProject.git
   cd blockProject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development environment**
   ```bash
   # Windows
   .\start.bat
   
   # Linux/macOS
   docker-compose up -d
   npm run dev
   ```

5. **Access the application**
   - Web Dashboard: http://localhost:3001
   - API Gateway: http://localhost:3000

## 🔧 Development

### Smart Contracts
```bash
cd packages/contracts
npm install
npx hardhat compile
npx hardhat test
npx hardhat node
```

### API Gateway
```bash
cd packages/api-gateway
npm install
npm run dev
```

### Web Dashboard
```bash
cd packages/web-dashboard
npm install
npm run dev
```

## 📱 User Roles & Features

### 👨‍🌾 Farmers
- Register new produce batches
- Generate QR codes for tracking
- Update harvest information
- Set initial quality grades

### 🚛 Transporters
- Scan QR codes to pick up batches
- Update logistics information
- Record transportation conditions
- Track delivery status

### 🏪 Wholesalers
- Verify batch authenticity
- Set wholesale prices
- Update batch status
- Record quality inspections

### 🛒 Retailers
- Scan QR codes for retail information
- Set retail prices
- Update inventory status
- Record sales information

### 👥 Consumers
- Scan QR codes to view full history
- Verify product authenticity
- View quality information
- Track origin and journey

### 🏛️ Government
- Monitor blockchain records
- Oversee fair pricing
- Audit supply chain compliance
- Generate reports

## 🔐 Security Features

- **Role-based Access Control**: Smart contract-based permissions
- **Data Integrity**: Blockchain-verified records
- **Secure Authentication**: JWT-based authentication
- **Input Validation**: Comprehensive data validation
- **Audit Trail**: Complete transaction history

## 🚀 Deployment

### Local Development
```bash
# Start all services
docker-compose up -d

# Deploy contracts
cd packages/contracts
npx hardhat run scripts/deploy.js --network localhost
```

### Production Deployment
See `deployment-plan.md` for detailed production deployment instructions.

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Batches
- `GET /api/batches` - List all batches
- `GET /api/batches/:id` - Get batch details
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:id` - Update batch

### QR Codes
- `POST /api/qr/generate` - Generate QR code
- `POST /api/qr/scan` - Scan QR code

## 🧪 Testing

```bash
# Test smart contracts
cd packages/contracts
npx hardhat test

# Test API
cd packages/api-gateway
npm test

# Test frontend
cd packages/web-dashboard
npm test
```

## 📈 Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced analytics dashboard
- [ ] IoT sensor integration
- [ ] Machine learning for quality prediction
- [ ] Multi-language support
- [ ] Advanced reporting features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation in `/docs`

## 🙏 Acknowledgments

- Ethereum Foundation for blockchain infrastructure
- Hardhat team for development tools
- React team for the frontend framework
- MongoDB team for database solutions

---

**AgriChain** - Bringing transparency to agricultural supply chains through blockchain technology.
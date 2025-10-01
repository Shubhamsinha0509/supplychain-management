# 🚀 How to Run the Blockchain Supply Chain Application

## Quick Start

### Option 1: Using the Batch Script (Windows)
```bash
# Double-click the start.bat file or run:
start.bat
```

### Option 2: Manual Start

#### 1. Start API Gateway
```bash
cd packages/api-gateway
node src/server.js
```
**API will be available at:** http://localhost:3000

#### 2. Start Web Dashboard (in a new terminal)
```bash
cd packages/web-dashboard
npm run dev -- --port 3001
```
**Web Dashboard will be available at:** http://localhost:3001

## 🌐 Access Points

- **Web Dashboard**: http://localhost:3001
- **API Gateway**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health
- **API Batches**: http://localhost:3000/api/batches

## 📱 Features Available

### Web Dashboard
- ✅ **Home Page**: Landing page with features overview
- ✅ **Dashboard**: Batch management and statistics
- ✅ **Login/Register**: User authentication forms
- ✅ **QR Scanner**: QR code scanning interface
- ✅ **Batch Details**: Detailed batch information
- ✅ **Responsive Design**: Works on desktop and mobile

### API Gateway
- ✅ **Health Check**: Service status monitoring
- ✅ **Batch Management**: CRUD operations for batches
- ✅ **Mock Data**: Sample data for testing
- ✅ **CORS Enabled**: Cross-origin requests supported
- ✅ **Rate Limiting**: API protection

## 🎯 What You Can Do

1. **View the Home Page**: See the application overview
2. **Register/Login**: Create user accounts
3. **View Dashboard**: See batch statistics and management
4. **Scan QR Codes**: Test the QR scanning functionality
5. **View Batch Details**: See complete batch information
6. **Test API**: Use the API endpoints for batch management

## 🔧 Development

### Frontend (React + Vite + Tailwind)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **HTTP Client**: Axios

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Security**: Helmet, CORS, Rate Limiting
- **Mock Data**: Sample batch and user data
- **API**: RESTful endpoints

## 📊 Sample Data

The application includes mock data for:
- **Batches**: Tomato, Wheat, Apple batches
- **Users**: Farmers, Transporters, Wholesalers
- **Events**: Supply chain tracking events
- **Quality Checks**: Quality assessment data
- **Pricing**: Fair pricing information

## 🚀 Next Steps

1. **Connect to Real Database**: Replace mock data with MongoDB
2. **Add Blockchain Integration**: Connect to Ethereum smart contracts
3. **Implement Authentication**: Add JWT-based authentication
4. **Add QR Code Generation**: Implement QR code creation
5. **Mobile App**: Create React Native mobile application

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000 and 3001
netstat -ano | findstr :3000
taskkill /PID <PID> /F

netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Dependencies Issues
```bash
# Clean install
npm install --legacy-peer-deps
```

### Services Not Starting
1. Check if Node.js is installed: `node --version`
2. Check if npm is installed: `npm --version`
3. Install dependencies: `npm install`
4. Check for port conflicts

## 📝 API Endpoints

### Health Check
```
GET /health
```

### Batches
```
GET /api/batches          # Get all batches
GET /api/batches/:id      # Get specific batch
POST /api/batches         # Create new batch
```

### Root
```
GET /                     # API information
```

## 🎉 Success!

If everything is running correctly, you should see:
- ✅ API Gateway running on port 3000
- ✅ Web Dashboard running on port 3001
- ✅ Both services accessible in your browser
- ✅ Mock data displaying in the dashboard

**Happy coding! 🚀**

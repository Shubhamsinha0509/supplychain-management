# DEPLOYMENT PLAN FOR BLOCKCHAIN SUPPLY-CHAIN APPLICATION

## DEPLOYMENT OPTIONS OVERVIEW

### 🏠 Low-Cost VPS/Raspberry Pi Deployment
**Target**: Small to medium farms, local cooperatives, cost-conscious organizations
**Budget**: $50-200/month
**Infrastructure**: Single server or small cluster

### ☁️ Cloud Deployment (AWS/GCP/Azure)
**Target**: Enterprise clients, large-scale operations, global distribution
**Budget**: $500-5000/month
**Infrastructure**: Multi-region, auto-scaling, enterprise-grade

---

## OPTION 1: LOW-COST VPS/RASPBERRY PI DEPLOYMENT

### 🎯 Target Use Cases
- Small to medium farms (1-100 farmers)
- Local agricultural cooperatives
- Pilot programs and proof-of-concept
- Offline-capable deployments
- Edge computing scenarios

### 💰 Cost Breakdown
```
Monthly Costs:
├── VPS (DigitalOcean/Linode): $20-80
├── Domain & SSL: $10-20
├── Backup Storage: $5-15
├── Monitoring: $0-10
└── Total: $35-125/month
```

### 🏗️ Infrastructure Architecture

#### Single Server Setup
```
┌─────────────────────────────────────┐
│           Raspberry Pi 4            │
│  ┌─────────────────────────────────┐ │
│  │        Docker Containers        │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │ │
│  │  │ API │ │ Web │ │ DB  │ │IPFS │ │ │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │        Local Blockchain         │ │
│  │     (Ganache/Hardhat)           │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Multi-Server Setup (Recommended)
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Server 1  │    │   Server 2  │    │   Server 3  │
│  ┌─────────┐│    │  ┌─────────┐│    │  ┌─────────┐│
│  │API + Web││    │  │Database ││    │  │Blockchain││
│  └─────────┘│    │  └─────────┘│    │  └─────────┘│
│  ┌─────────┐│    │  ┌─────────┐│    │  ┌─────────┐│
│  │  Redis  ││    │  │  IPFS   ││    │  │  Nginx  ││
│  └─────────┘│    │  └─────────┘│    │  └─────────┘│
└─────────────┘    └─────────────┘    └─────────────┘
```

### 📋 Deployment Steps

#### Step 1: Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Step 2: Application Deployment
```bash
# Clone repository
git clone https://github.com/your-org/supply-chain-blockchain.git
cd supply-chain-blockchain

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

#### Step 3: Database Setup
```bash
# Initialize MongoDB
docker exec -it mongodb mongosh
use supplychain
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: ["readWrite", "dbAdmin"]
})

# Create indexes
db.batches.createIndex({ "batchId": 1 })
db.batches.createIndex({ "farmer": 1 })
db.batches.createIndex({ "blockchainStatus": 1 })
```

#### Step 4: Blockchain Setup
```bash
# Deploy smart contracts
cd packages/contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost

# Update contract addresses in .env
echo "SUPPLY_CHAIN_CONTRACT_ADDRESS=0x..." >> .env
echo "PRICING_CONTRACT_ADDRESS=0x..." >> .env
```

### 🔧 Configuration Files

#### docker-compose.prod.yml
```yaml
version: '3.8'
services:
  api-gateway:
    build: ./packages/api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/supplychain
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped

  web-dashboard:
    build: ./packages/web-dashboard
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - API_URL=http://api-gateway:3000
    depends_on:
      - api-gateway
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongodb-init.js:/docker-entrypoint-initdb.d/init.js
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=secure_password
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  ipfs:
    image: ipfs/go-ipfs:latest
    ports:
      - "4001:4001"
      - "5001:5001"
    volumes:
      - ipfs_data:/data/ipfs
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - api-gateway
      - web-dashboard
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
  ipfs_data:
```

#### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api-gateway:3000;
    }
    
    upstream web {
        server web-dashboard:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/ssl/cert.pem;
        ssl_certificate_key /etc/ssl/key.pem;

        location /api/ {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location / {
            proxy_pass http://web;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### 🔒 Security Configuration

#### Firewall Setup
```bash
# Configure UFW
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 27017/tcp
sudo ufw deny 6379/tcp
```

#### SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 📊 Monitoring Setup

#### Basic Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Setup log rotation
sudo nano /etc/logrotate.d/supply-chain
```

#### Health Checks
```bash
#!/bin/bash
# health-check.sh

# Check API health
curl -f http://localhost:3000/health || exit 1

# Check database
docker exec mongodb mongosh --eval "db.adminCommand('ping')" || exit 1

# Check Redis
docker exec redis redis-cli ping || exit 1

echo "All services healthy"
```

---

## OPTION 2: CLOUD DEPLOYMENT (AWS/GCP/AZURE)

### 🎯 Target Use Cases
- Enterprise clients
- Large-scale operations (100+ farmers)
- Global distribution
- High availability requirements
- Compliance and certification needs

### 💰 Cost Breakdown (AWS)
```
Monthly Costs:
├── EC2 Instances (3x t3.medium): $150-300
├── RDS PostgreSQL: $100-200
├── ElastiCache Redis: $50-100
├── S3 Storage: $20-50
├── CloudFront CDN: $10-30
├── Load Balancer: $20-40
├── Route 53: $5-10
└── Total: $355-730/month
```

### 🏗️ Cloud Architecture

#### AWS Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Region 1  │  │   Region 2  │  │   Region 3  │          │
│  │  ┌─────────┐│  │  ┌─────────┐│  │  ┌─────────┐│          │
│  │  │   API   ││  │  │   API   ││  │  │   API   ││          │
│  │  └─────────┘│  │  └─────────┘│  │  └─────────┘│          │
│  │  ┌─────────┐│  │  ┌─────────┐│  │  ┌─────────┐│          │
│  │  │   Web   ││  │  │   Web   ││  │  │   Web   ││          │
│  │  └─────────┘│  │  └─────────┘│  │  └─────────┘│          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Shared Services                            │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │ │
│  │  │   RDS   │ │ElastiCache│ │   S3    │ │CloudFront│    │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 📋 Cloud Deployment Steps

#### Step 1: Infrastructure Setup (Terraform)
```hcl
# main.tf
provider "aws" {
  region = "us-west-2"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# Subnets
resource "aws_subnet" "public" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
}

# Security Groups
resource "aws_security_group" "web" {
  name_prefix = "supply-chain-web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier     = "supply-chain-db"
  engine         = "postgres"
  engine_version = "14.7"
  instance_class = "db.t3.medium"
  allocated_storage = 100
  storage_encrypted = true

  db_name  = "supplychain"
  username = "admin"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
}
```

#### Step 2: Kubernetes Deployment
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: supply-chain/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: mongodb-uri
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
spec:
  selector:
    app: api-gateway
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
```

#### Step 3: CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Build and push Docker images
      run: |
        docker build -t supply-chain/api-gateway ./packages/api-gateway
        docker tag supply-chain/api-gateway:latest $ECR_REGISTRY/supply-chain/api-gateway:latest
        docker push $ECR_REGISTRY/supply-chain/api-gateway:latest
    
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --region us-west-2 --name supply-chain-cluster
        kubectl apply -f k8s-deployment.yaml
        kubectl rollout status deployment/api-gateway
```

### 🔧 Cloud Configuration

#### Environment Variables
```bash
# Production environment
NODE_ENV=production
MONGODB_URI=mongodb+srv://admin:password@cluster.mongodb.net/supplychain
REDIS_URL=redis://elasticache-cluster.cache.amazonaws.com:6379
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
SUPPLY_CHAIN_CONTRACT_ADDRESS=0x...
PRICING_CONTRACT_ADDRESS=0x...
JWT_SECRET=your-super-secret-jwt-key
QR_SIGNATURE_SECRET=your-qr-signature-secret
```

#### Monitoring Setup (CloudWatch)
```yaml
# cloudwatch-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cloudwatch-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*api-gateway*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      format json
    </source>
    
    <match kubernetes.**>
      @type cloudwatch_logs
      log_group_name supply-chain-api
      log_stream_name api-gateway
      region us-west-2
    </match>
```

---

## DEPLOYMENT COMPARISON

| Feature | Low-Cost VPS | Cloud Deployment |
|---------|--------------|------------------|
| **Cost** | $35-125/month | $355-730/month |
| **Scalability** | Manual scaling | Auto-scaling |
| **Availability** | 95-99% | 99.9%+ |
| **Maintenance** | Manual | Automated |
| **Security** | Basic | Enterprise-grade |
| **Compliance** | Limited | Full compliance |
| **Global Reach** | Single region | Multi-region |
| **Backup** | Manual | Automated |
| **Monitoring** | Basic | Advanced |
| **Support** | Community | 24/7 support |

---

## DEPLOYMENT RECOMMENDATIONS

### 🚀 Start with Low-Cost VPS
**When to choose:**
- Pilot programs
- Small to medium farms
- Budget constraints
- Learning and development
- Local/regional deployment

**Migration path:**
- Start with VPS for MVP
- Monitor usage and performance
- Migrate to cloud when needed
- Maintain hybrid approach

### ☁️ Go Direct to Cloud
**When to choose:**
- Enterprise clients
- Global deployment
- High availability needs
- Compliance requirements
- Large-scale operations

**Best practices:**
- Use Infrastructure as Code
- Implement CI/CD pipelines
- Set up monitoring from day one
- Plan for multi-region deployment
- Implement disaster recovery

---

## MONITORING & MAINTENANCE

### 📊 Key Metrics to Monitor
- **Application Performance**
  - Response time < 200ms
  - Error rate < 0.1%
  - Throughput > 1000 req/s
  - Uptime > 99.9%

- **Infrastructure Health**
  - CPU usage < 70%
  - Memory usage < 80%
  - Disk usage < 85%
  - Network latency < 100ms

- **Business Metrics**
  - User registrations
  - Batch registrations
  - QR code scans
  - Transaction volume

### 🔧 Maintenance Tasks
- **Daily**
  - Check system health
  - Review error logs
  - Monitor resource usage

- **Weekly**
  - Update dependencies
  - Review security logs
  - Backup verification

- **Monthly**
  - Security updates
  - Performance optimization
  - Capacity planning

This deployment plan provides comprehensive options for both cost-conscious and enterprise deployments, ensuring the blockchain supply chain application can scale from pilot programs to global enterprise solutions.

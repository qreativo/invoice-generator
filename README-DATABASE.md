# Lunara Invoice Management - Database Integration

## 🗄️ Database Setup

### MySQL Configuration
- **Host**: 107.175.179.122
- **Username**: lunara
- **Password**: SbX7s8aMjf7xZX2e
- **Database**: lunara_invoices
- **Port**: 3306

### 📋 Database Schema

The application uses a comprehensive MySQL schema with the following tables:

#### Core Tables
1. **users** - User accounts and authentication
2. **invoices** - Invoice main data
3. **invoice_items** - Invoice line items
4. **user_sessions** - JWT session management
5. **system_settings** - Application configuration
6. **audit_logs** - Activity tracking

#### Features
- ✅ UUID primary keys for security
- ✅ Foreign key constraints
- ✅ Indexes for performance
- ✅ Audit logging with triggers
- ✅ Stored procedures for complex operations
- ✅ Views for reporting

## 🚀 Backend API Server

### Setup Instructions

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Run the schema.sql file in your MySQL server
mysql -h 107.175.179.122 -u lunara -p < database/schema.sql
```

4. **Start Server**
```bash
npm run dev  # Development
npm start    # Production
```

### 🔐 Security Features

- **JWT Authentication** with 7-day expiry
- **Cloudflare Turnstile** integration for registration
- **Rate limiting** (100 requests per 15 minutes)
- **Helmet.js** for security headers
- **CORS** configuration
- **Password hashing** with bcrypt
- **SQL injection** protection with prepared statements

### 📡 API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

#### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Invoices
- `GET /api/invoices` - Get user's invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `PATCH /api/invoices/:id/status` - Update status
- `GET /api/invoices/search` - Search invoices

## 🔄 Hybrid Data Service

The application uses a **hybrid approach**:

### API Mode (When Backend Available)
- All data stored in MySQL database
- Real-time synchronization
- Multi-user support
- Audit logging
- Advanced security

### Fallback Mode (When Backend Unavailable)
- Data stored in localStorage
- Single-user mode
- Offline functionality
- Automatic fallback

### Auto-Detection
```javascript
// The app automatically detects API availability
const isApiAvailable = await fetch('/api/health');
```

## 🛠️ Development Workflow

### 1. Local Development
```bash
# Frontend (Vite)
npm run dev

# Backend (Express)
cd backend
npm run dev
```

### 2. Database Migration
```bash
# Run schema updates
mysql -h 107.175.179.122 -u lunara -p lunara_invoices < database/migrations/001_initial.sql
```

### 3. Testing
```bash
# Test API endpoints
curl http://localhost:3001/api/health

# Test database connection
npm run test
```

## 📊 Database Performance

### Indexes Created
- User lookup by username/email
- Invoice filtering by status/date
- Client name search
- Amount-based sorting

### Optimizations
- Connection pooling (10 connections)
- Query timeout handling
- Prepared statements
- Efficient JOIN operations

## 🔒 Security Considerations

### Production Checklist
- [ ] Change JWT secret key
- [ ] Enable SSL/TLS for database
- [ ] Configure firewall rules
- [ ] Set up backup strategy
- [ ] Monitor audit logs
- [ ] Update rate limiting rules

### Environment Variables
```env
JWT_SECRET=your-super-secret-key
DB_SSL=true
RATE_LIMIT_MAX=50
```

## 📈 Monitoring & Logging

### Audit Trail
- User registration/login
- Invoice creation/updates
- Status changes
- Admin actions

### Performance Metrics
- API response times
- Database query performance
- Error rates
- User activity

## 🚀 Deployment

### Backend Deployment
1. Deploy to your server (VPS, AWS, etc.)
2. Configure environment variables
3. Set up process manager (PM2)
4. Configure reverse proxy (Nginx)
5. Enable SSL certificate

### Frontend Integration
The frontend automatically detects and uses the API when available, providing seamless integration between local storage and database modes.

---

**Note**: The current WebContainer environment doesn't support direct MySQL connections, so the backend server needs to be deployed separately to your server infrastructure.
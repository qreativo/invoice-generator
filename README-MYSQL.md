# 🗄️ MySQL Database Integration - Lunara Invoice Management

## 🚀 **Solusi Lengkap untuk Database MySQL**

Saya sudah membuat backend API server yang akan menghubungkan aplikasi Anda ke database MySQL dengan aman dan stabil.

## 📋 **Langkah-langkah Setup:**

### **1. Setup Backend Server**

```bash
# Masuk ke folder backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env jika diperlukan (opsional)
nano .env
```

### **2. Jalankan Backend Server**

```bash
# Development mode
npm run dev

# Atau production mode
npm start
```

**Server akan berjalan di:** `http://localhost:3001`

### **3. Test Koneksi Database**

Setelah server berjalan, Anda akan melihat:
```
🚀 Lunara API Server running on port 3001
📊 Database: 107.175.179.122:3306/lunara
✅ Database initialized successfully
👥 Default Login Accounts:
   Admin: admin / admin123
   Demo:  demo / demo123
```

### **4. Test Frontend Connection**

1. **Buka aplikasi frontend** di browser: `http://localhost:5173`
2. **Refresh halaman** - aplikasi akan otomatis detect backend
3. **Login dengan akun default:**
   - **Username:** `admin` | **Password:** `admin123`
   - **Username:** `demo` | **Password:** `demo123`

## 🔧 **Fitur Backend API:**

### **✅ Database Management:**
- **Auto-create tables** jika belum ada
- **Default users** otomatis dibuat
- **Connection pooling** untuk performance
- **Transaction support** untuk data integrity

### **✅ Security Features:**
- **JWT Authentication** dengan 7-day expiry
- **Password hashing** dengan bcrypt
- **Rate limiting** (100 requests per 15 minutes)
- **CORS protection**
- **SQL injection protection**

### **✅ API Endpoints:**
- `POST /api/auth/login` - User login
- `GET /api/users` - Get all users (admin only)
- `GET /api/invoices` - Get user's invoices
- `POST /api/invoices` - Create invoice
- `PATCH /api/invoices/:id/status` - Update invoice status

## 🗄️ **Database Tables:**

Backend akan otomatis membuat tables:

1. **`users`** - User accounts & authentication
2. **`invoices`** - Invoice main data
3. **`invoice_items`** - Invoice line items

## 🔒 **Default User Accounts:**

### **Admin Account:**
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `admin`
- **Email:** `admin@lunara.com`

### **Demo Account:**
- **Username:** `demo`
- **Password:** `demo123`
- **Role:** `member`
- **Email:** `demo@lunara.com`

## 🚀 **Deployment ke Server:**

### **1. Upload Backend ke Server Anda:**
```bash
# Copy folder backend ke server
scp -r backend/ user@your-server.com:/path/to/backend/

# SSH ke server
ssh user@your-server.com

# Masuk ke folder backend
cd /path/to/backend/

# Install dependencies
npm install

# Install PM2 untuk process management
npm install -g pm2

# Jalankan dengan PM2
pm2 start server.js --name "lunara-api"
```

### **2. Update Frontend Configuration:**
```javascript
// Di src/utils/api.ts, ganti URL:
this.baseUrl = 'https://your-server.com:3001/api';
```

## 🔧 **Troubleshooting:**

### **Jika Backend Error:**
1. **Cek koneksi MySQL:** Pastikan database `lunara` ada
2. **Cek credentials:** Username `lunara` dan password benar
3. **Cek firewall:** Port 3306 terbuka untuk koneksi
4. **Cek logs:** `npm run dev` untuk melihat error detail

### **Jika Frontend Tidak Connect:**
1. **Pastikan backend running:** `http://localhost:3001/api/health`
2. **Cek CORS:** Frontend dan backend di domain yang sama
3. **Refresh browser:** Clear cache dan refresh

## 💡 **Keuntungan Solusi Ini:**

✅ **Stabil** - Backend terpisah, tidak ada conflict browser  
✅ **Aman** - JWT authentication dan password hashing  
✅ **Scalable** - Bisa di-deploy ke server production  
✅ **Fallback** - Tetap ada localStorage backup  
✅ **Real Database** - Data tersimpan permanen di MySQL  

**Sekarang Anda punya solusi database yang benar-benar bekerja!** 🎉
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const responseRoutes = require('./routes/responses');
const userRoutes = require('./routes/users');
const initDatabase = require('./init_db');

const rateLimit = require('express-rate-limit');

const app = express();

// Ensure uploads directory exists on server startup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Dynamic CORS configuration allowing localhost, mobile apps, Vercel, Netlify, and custom frontend URLs
const rawFrontendUrls = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(s => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    ...rawFrontendUrls
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);

        const cleanOrigin = origin.replace(/\/+$/, '');

        if (
            allowedOrigins.includes(cleanOrigin) ||
            allowedOrigins.includes('*') ||
            /^https?:\/\/localhost(:\d+)?$/.test(cleanOrigin) ||
            /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(cleanOrigin) ||
            /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(cleanOrigin) ||
            /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(cleanOrigin) ||
            /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+(:\d+)?$/.test(cleanOrigin) ||
            /\.vercel\.app$/.test(cleanOrigin) ||
            /\.netlify\.app$/.test(cleanOrigin)
        ) {
            return callback(null, true);
        }

        // Production fallback: allow request origin to avoid cross-domain blocking
        return callback(null, true);
    },
    credentials: true
}));

// Rate Limiting (1000 requests per 15 minutes to allow smooth multi-user development & polling)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use('/uploads', express.static(uploadsDir));

// Root & Health Check routes
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Pengaduan Masyarakat API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', async (req, res) => {
    try {
        const pool = require('./config/db');
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
    }
});

// Routes
app.use('/auth', authRoutes);
app.use('/complaints', complaintRoutes);
app.use('/responses', responseRoutes);
app.use('/users', userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // Auto initialize database tables and default admin if not existing
    try {
        await initDatabase();
    } catch (e) {
        console.warn('Note: Database auto-init skipped or failed:', e.message);
    }
});

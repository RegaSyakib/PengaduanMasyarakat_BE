const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const responseRoutes = require('./routes/responses');
const userRoutes = require('./routes/users');

const rateLimit = require('express-rate-limit');

const app = express();

// Secure CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (
            !origin || 
            allowedOrigins.includes(origin) || 
            /^https?:\/\/localhost:\d+$/.test(origin) || 
            /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
            /^https?:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin) ||
            /^https?:\/\/10\.\d+\.\d+\.\d+:\d+$/.test(origin)
        ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per 15 minutes
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/complaints', complaintRoutes);
app.use('/responses', responseRoutes);
app.use('/users', userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

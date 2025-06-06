require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const paymentRoutes = require('./routes/payments');
const expenseRoutes = require('./routes/expenses');
const donationRoutes = require('./routes/donations');

const app = express();

// CORS Configuration
const allowedOrigins = [
    'https://final-kfwg.onrender.com',
    'http://localhost:5000',
    'http://localhost:3000',
    'https://ledo-sports-academy.onrender.com',
    'https://ledo.onrender.com'
];

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// CORS middleware
app.use(cors({
    origin: function(origin, callback) {
        console.log('Checking origin:', origin);
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('No origin provided, allowing request');
            return callback(null, true);
        }

        // Check if the origin is allowed
        if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
            console.log('Origin allowed:', origin);
            callback(null, true);
        } else {
            console.log('Origin not allowed:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ledosportsacademy:KYbsTxWjVBvPnREP@ledosportsacademy.ejcd06z.mongodb.net/ledosportsacademy?retryWrites=true&w=majority';

console.log('Environment Check:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MongoDB URI exists:', !!MONGODB_URI);

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
    console.log('Successfully connected to MongoDB Atlas');
    console.log('Database connection established');
})
.catch(err => {
    console.error('MongoDB connection error details:');
    console.error(err);
    process.exit(1);
});

// Monitor MongoDB connection
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/donations', donationRoutes);

// Basic health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Serve static files
app.use(express.static('public'));

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    
    // Handle CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            message: 'CORS error: Origin not allowed',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Access denied'
        });
    }
    
    // Handle JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
            message: 'Invalid JSON',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Bad request'
        });
    }
    
    // Default error response
    res.status(err.status || 500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
}); 

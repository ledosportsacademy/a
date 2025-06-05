const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt - Request body:', { 
            email: req.body.email,
            hasPassword: !!req.body.password 
        });

        const { email, password } = req.body;

        if (!email || !password) {
            console.log('Missing credentials - Email or password not provided');
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            console.log('Authentication failed - User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            console.log('Authentication failed - Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if JWT_SECRET is properly set
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET is not set in environment variables');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            jwtSecret,
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', email);
        res.json({ 
            token, 
            user: { 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (error) {
        console.error('Login error - Full details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ 
            message: 'Server error', 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Register route (admin only)
router.post('/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ email, password, role });
        await user.save();

        console.log('New user registered:', email);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 

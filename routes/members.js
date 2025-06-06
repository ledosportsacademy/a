const express = require('express');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Donation = require('../models/Donation');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all members (public route with limited data)
router.get('/', async (req, res) => {
    try {
        console.log('Fetching members...');
        
        // Check MongoDB connection
        if (Member.db.readyState !== 1) {
            console.error('MongoDB not connected. Current state:', Member.db.readyState);
            throw new Error('Database connection error');
        }
        
        const members = await Member.find().sort({ name: 1 });
        console.log(`Found ${members.length} members`);
        
        if (!Array.isArray(members)) {
            console.error('Invalid members data type:', typeof members);
            throw new Error('Invalid data format from database');
        }
        
        // Check if user is authenticated
        const isAdmin = req.header('Authorization')?.startsWith('Bearer ');
        console.log('Request is admin:', isAdmin);
        
        // Filter data based on authentication
        const filteredMembers = members.map(member => {
            const publicMember = {
                _id: member._id,
                name: member.name,
                photo: member.photo,
                active: member.active
            };
            
            if (isAdmin) {
                publicMember.phone = member.phone;
            }
            
            return publicMember;
        });

        console.log(`Returning ${filteredMembers.length} filtered members`);
        res.json(filteredMembers);
    } catch (error) {
        console.error('Error fetching members:', error);
        if (error.name === 'MongooseError' || error.name === 'MongoError') {
            return res.status(503).json({ 
                message: 'Database service unavailable',
                error: error.message 
            });
        }
        res.status(500).json({ 
            message: 'Server error while fetching members',
            error: error.message 
        });
    }
});

// Get payments (public route)
router.get('/payments', async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('member', '_id name')
            .sort('-createdAt');
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get expenses (public route)
router.get('/expenses', async (req, res) => {
    try {
        const expenses = await Expense.find().sort('-createdAt');
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get donations (public route)
router.get('/donations', async (req, res) => {
    try {
        const donations = await Donation.find().sort('-createdAt');
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get summary statistics (public route)
router.get('/summary', async (req, res) => {
    try {
        const { weekNumber, year } = req.query;
        const currentWeek = weekNumber || Math.ceil((new Date() - new Date(2025, 5, 1)) / (7 * 24 * 60 * 60 * 1000));
        const currentYear = year || 2025;

        // Get total members
        const totalMembers = await Member.countDocuments();

        // Get weekly payment stats
        const weeklyStats = await Payment.aggregate([
            { $match: { weekNumber: parseInt(currentWeek), year: parseInt(currentYear) } },
            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
        ]);

        // Get total collections
        const totalCollections = await Payment.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Get total expenses
        const totalExpenses = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Get total donations
        const totalDonations = await Donation.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            totalMembers,
            weeklyPaidCount: weeklyStats[0]?.count || 0,
            weeklyUnpaidCount: totalMembers - (weeklyStats[0]?.count || 0),
            weeklyCollection: weeklyStats[0]?.total || 0,
            totalCollections: totalCollections[0]?.total || 0,
            totalExpenses: totalExpenses[0]?.total || 0,
            totalDonations: totalDonations[0]?.total || 0
        });
    } catch (error) {
        console.error('Error getting summary:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single member by ID (admin only)
router.get('/:id', auth, async (req, res) => {
    try {
        console.log('Fetching member by ID:', req.params.id);
        const member = await Member.findById(req.params.id);
        
        if (!member) {
            console.log('Member not found:', req.params.id);
            return res.status(404).json({ message: 'Member not found' });
        }
        
        console.log('Member found:', member);
        res.json(member);
    } catch (error) {
        console.error('Error fetching member:', error);
        res.status(500).json({ 
            message: 'Error fetching member details',
            error: error.message 
        });
    }
});

// Add new member (admin only)
router.post('/', auth, async (req, res) => {
    try {
        console.log('Creating new member:', req.body);
        const member = new Member(req.body);
        await member.save();
        console.log('Member created successfully:', member);
        res.status(201).json(member);
    } catch (error) {
        console.error('Error creating member:', error);
        res.status(400).json({ 
            message: 'Error creating member',
            error: error.message 
        });
    }
});

// Update member (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        console.log('Updating member:', req.params.id, req.body);
        const member = await Member.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!member) {
            console.log('Member not found:', req.params.id);
            return res.status(404).json({ message: 'Member not found' });
        }
        console.log('Member updated successfully:', member);
        res.json(member);
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(400).json({ 
            message: 'Error updating member',
            error: error.message 
        });
    }
});

// Delete member (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        console.log('Deleting member:', req.params.id);
        const member = await Member.findByIdAndDelete(req.params.id);
        if (!member) {
            console.log('Member not found:', req.params.id);
            return res.status(404).json({ message: 'Member not found' });
        }
        console.log('Member deleted successfully:', member);
        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ 
            message: 'Error deleting member',
            error: error.message 
        });
    }
});

module.exports = router; 

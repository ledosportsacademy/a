const express = require('express');
const Donation = require('../models/Donation');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all donations
router.get('/', auth, async (req, res) => {
    try {
        const donations = await Donation.find().sort('-createdAt');
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add new donation
router.post('/', auth, async (req, res) => {
    try {
        const donation = new Donation(req.body);
        await donation.save();
        res.status(201).json(donation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get donation statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const totalDonations = await Donation.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            totalDonations: totalDonations[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 
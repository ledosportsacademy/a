const express = require('express');
const Member = require('../models/Member');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all members (public route)
router.get('/', async (req, res) => {
    try {
        const members = await Member.find().sort({ name: 1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add new member (admin only)
router.post('/', auth, async (req, res) => {
    try {
        const member = new Member(req.body);
        await member.save();
        res.status(201).json(member);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update member (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        const member = await Member.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json(member);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete member (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const member = await Member.findByIdAndDelete(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 

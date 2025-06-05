const express = require('express');
const Member = require('../models/Member');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all members (public route)
router.get('/', async (req, res) => {
    try {
        console.log('Fetching all members...');
        const members = await Member.find().sort({ name: 1 });
        console.log(`Found ${members.length} members`);
        res.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ 
            message: 'Server error while fetching members',
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

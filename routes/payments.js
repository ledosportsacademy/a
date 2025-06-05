const express = require('express');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const router = express.Router();
const Expense = require('../models/Expense');

// Get payments by week and year
router.get('/', auth, async (req, res) => {
    try {
        const { weekNumber, year } = req.query;
        const query = {};
        
        if (weekNumber) query.weekNumber = weekNumber;
        if (year) query.year = year;

        const payments = await Payment.find(query)
            .populate('member', 'name phone')
            .sort('-createdAt');
        
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Record new payment
router.post('/', auth, async (req, res) => {
    try {
        // Delete existing payment if any
        await Payment.deleteOne({
            member: req.body.member,
            weekNumber: req.body.weekNumber,
            year: req.body.year
        });

        // Create new payment
        const payment = new Payment(req.body);
        await payment.save();
        
        const populatedPayment = await Payment.findById(payment._id)
            .populate('member', 'name phone');
        
        res.status(201).json(populatedPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get payment statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const { weekNumber, year } = req.query;
        
        const totalCollected = await Payment.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const weeklyStats = await Payment.aggregate([
            { $match: { weekNumber: parseInt(weekNumber), year: parseInt(year) } },
            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
        ]);

        res.json({
            totalCollected: totalCollected[0]?.total || 0,
            weeklyPaidCount: weeklyStats[0]?.count || 0,
            weeklyTotal: weeklyStats[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete payment
router.delete('/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findByIdAndDelete(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get weekly analysis
router.get('/weekly-analysis', auth, async (req, res) => {
    try {
        const { year } = req.query;
        const currentYear = year || new Date().getFullYear();

        // Get weekly payments for the entire year
        const weeklyStats = await Payment.aggregate([
            { 
                $match: { 
                    year: parseInt(currentYear)
                }
            },
            {
                $group: {
                    _id: '$weekNumber',
                    totalAmount: { $sum: '$amount' },
                    memberCount: { $sum: 1 },
                    members: { $push: '$member' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get weekly expenses
        const weeklyExpenses = await Expense.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(currentYear, 0, 1),
                        $lt: new Date(parseInt(currentYear) + 1, 0, 1)
                    }
                }
            },
            {
                $project: {
                    weekNumber: { 
                        $ceil: {
                            $divide: [
                                { $dayOfYear: '$createdAt' },
                                7
                            ]
                        }
                    },
                    amount: 1
                }
            },
            {
                $group: {
                    _id: '$weekNumber',
                    totalExpenses: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Combine data for response
        const analysis = weeklyStats.map(week => ({
            weekNumber: week._id,
            totalCollected: week.totalAmount,
            membersPaid: week.memberCount,
            expenses: weeklyExpenses.find(exp => exp._id === week._id)?.totalExpenses || 0,
            netAmount: week.totalAmount - (weeklyExpenses.find(exp => exp._id === week._id)?.totalExpenses || 0)
        }));

        res.json({
            year: currentYear,
            weeklyAnalysis: analysis,
            summary: {
                totalCollected: analysis.reduce((sum, week) => sum + week.totalCollected, 0),
                totalExpenses: analysis.reduce((sum, week) => sum + week.expenses, 0),
                netAmount: analysis.reduce((sum, week) => sum + week.netAmount, 0),
                averageWeeklyCollection: analysis.reduce((sum, week) => sum + week.totalCollected, 0) / analysis.length || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 
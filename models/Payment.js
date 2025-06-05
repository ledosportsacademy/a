const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    weekNumber: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique payment per member per week per year
paymentSchema.index({ member: 1, weekNumber: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema); 
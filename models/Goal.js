const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    seance_type: {
        type: Number,
        required: true
    },
    goal_type: {
        type: Number,
        required: true
    },
    goal_value: {
        type: Number,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Goal', GoalSchema);
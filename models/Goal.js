const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    seance_type: {
        type: Number,
        enum: [1, 2, 3], // 1: Course, 2: Vélo, 3: Musculation
        required: true
    },
    goal_type: {
        type: Number,
        enum: [1, 2, 3], // 1: Distance, 2: Duration, 3: Calories
        required: true
    },
    goal_value: {
        type: Number,
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_achieved: {
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Goal', GoalSchema);
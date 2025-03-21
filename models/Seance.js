const mongoose = require('mongoose');

const SeanceSchema = new mongoose.Schema({
    type: { 
        type: Number,
        enum: [1, 2, 3], // 1: Course, 2: Vélo, 3: Musculation
        required: true 
    },
    duration: { 
        type: Number, 
        required: true, 
    },
    date: { 
        type: Date, 
        required: true,
        default: Date.now
    },
    distance: {
        type: Number,
        required: true,
    },
    calories: {
        type: Number,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Seance', SeanceSchema);
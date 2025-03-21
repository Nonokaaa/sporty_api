let express = require('express');
let router = express.Router();
const Seance = require('../models/Seance');
const User = require('../models/User');

router.post('/create', async function (req, res, next) {
    try {
        const { type, duration, distance, calories, user } = req.body;

        // Validate input
        if (!type) {
            return res.status(400).json({ error: 'Type is required' });
        } else if (![1, 2, 3].includes(type)) {
            return res.status(400).json({ error: 'Type must be 1 (Course), 2 (Vélo), or 3 (Musculation)' });
        }

        if (duration === undefined) {
            return res.status(400).json({ error: 'Duration is required' });
        } else if (typeof duration !== 'number') {
            return res.status(400).json({ error: 'Duration must be a number' });
        } else if (duration <= 0) {
            return res.status(400).json({ error: 'Duration must be greater than 0' });
        }

        if (!distance) {
            return res.status(400).json({ error: 'Distance is required' });
        } else if (typeof distance !== 'number') {
            return res.status(400).json({ error: 'Distance must be a number' });
        } else if (distance < 0) {
            return res.status(400).json({ error: 'Distance must be greater than or equal to 0' });
        }

        if (!calories) {
            return res.status(400).json({ error: 'Calories are required' });
        } else if (typeof calories !== 'number') {
            return res.status(400).json({ error: 'Calories must be a number' });
        } else if (calories < 0) {
            return res.status(400).json({ error: 'Calories must be greater than or equal to 0' });
        }

        if (!user) {
            return res.status(400).json({ error: 'User must be logged in' });
        }

        // Check if user exists
        const foundUser = await User.findById(user);
        console.log(user);
        //List of all users
        allUsers = await User.find();
        console.log(allUsers);
        if (!foundUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create and save the seance
        const seance = new Seance({ type, duration, distance, calories, user: foundUser._id });
        const savedSeance = await seance.save();

        // Send the response
        res.status(201).json(savedSeance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

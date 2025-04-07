let express = require('express');
let router = express.Router();
const Seance = require('../models/Seance');
const User = require('../models/User');
const mongoose = require('mongoose');
const { auth } = require('../middlewares/auth');

router.post('/', auth, async function (req, res, next) {
    try {
        const { type, duration, distance, calories } = req.body;
        let userID = req.user.id;

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

        // Check if user exists
        const foundUser = await User.findById(userID);
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

// Edit seance by ID
router.put('/:seanceId', auth, async function (req, res, next) {
    try {
        const seanceId = req.params.seanceId;
        const userID = req.user.id;
        const { type, duration, distance, calories } = req.body;

        // Validate seanceId format
        if (!mongoose.Types.ObjectId.isValid(seanceId)) {
            return res.status(400).json({ error: 'Invalid seance ID' });
        }
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

        // Check if user exists
        const foundUser = await User.findById(userID);
        if (!foundUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        //Check if user is the owner of the seance found.
        const foundSeance = await Seance.findById(seanceId);
        if (!foundSeance) {
            return res.status(404).json({ error: 'Seance not found' });
        }
        if (foundSeance.user.toString() !== userID) {
            return res.status(403).json({ error: 'You are not authorized to edit this seance' });
        }

        // Find and update the seance
        const updatedSeance = await Seance.findByIdAndUpdate(seanceId, { type, duration, distance, calories }, { new: true });

        // Check if seance was found
        if (!updatedSeance) {
            return res.status(404).json({ error: 'Seance not found' });
        }
        // Send the response
        res.status(200).json(updatedSeance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete seance by ID
router.delete('/:seanceId', auth, async function (req, res, next) {
    try {
        const seanceId = req.params.seanceId;
        const userID = req.user.id;

        // Validate seanceId format
        if (!mongoose.Types.ObjectId.isValid(seanceId)) {
            return res.status(400).json({ error: 'Invalid seance ID' });
        }

        // Check if user exists
        const foundUser = await User.findById(userID);
        if (!foundUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        //Check if user is the owner of the seance found.
        const foundSeance = await Seance.findById(seanceId);
        if (!foundSeance) {
            return res.status(404).json({ error: 'Seance not found' });
        }
        if (foundSeance.user.toString() !== userID) {
            return res.status(403).json({ error: 'You are not authorized to delete this seance' });
        }

        // Delete the seance
        await Seance.findByIdAndDelete(seanceId);

        // Send the response
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all seances for a user
router.get('/', auth, async function (req, res, next) {
    try {
        const userID = req.user.id;

        // Check if user exists
        const foundUser = await User.findById(userID);
        if (!foundUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find all seances for the user
        const seances = await Seance.find({ user: foundUser._id });

        // Send the response
        res.status(200).json(seances);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
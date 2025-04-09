const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const Seance = require('../models/Seance');
const { auth } = require('../middlewares/auth');
const mongoose = require('mongoose');

// Create a new goal
router.post('/', auth, async (req, res) => {
    try {
        const { seance_type, goal_type, goal_value, start_date, end_date } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!seance_type) {
            return res.status(400).json({ error: 'Session type is required' });
        } else if (![1, 2, 3].includes(seance_type)) {
            return res.status(400).json({ error: 'Session type must be 1 (Course), 2 (Vélo), or 3 (Musculation)' });
        }

        if (!goal_type) {
            return res.status(400).json({ error: 'Goal type is required' });
        } else if (![1, 2, 3].includes(goal_type)) {
            return res.status(400).json({ error: 'Goal type must be 1 (Distance), 2 (Duration), or 3 (Calories)' });
        }

        if (goal_value === undefined) {
            return res.status(400).json({ error: 'Goal value is required' });
        } else if (typeof goal_value !== 'number' || goal_value <= 0) {
            return res.status(400).json({ error: 'Goal value must be a positive number' });
        }

        if (!start_date) {
            return res.status(400).json({ error: 'Start date is required' });
        }

        if (!end_date) {
            return res.status(400).json({ error: 'End date is required' });
        }

        const startDateObj = new Date(start_date);
        const endDateObj = new Date(end_date);
        const now = new Date();

        if (isNaN(startDateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid start date format' });
        }

        if (isNaN(endDateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid end date format' });
        }

        if (endDateObj <= startDateObj) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        // Check if end date is in the past
        if (endDateObj < now) {
            return res.status(400).json({ error: 'End date cannot be in the past' });
        }

        // Check if user already has an active goal
        const activeGoal = await Goal.findOne({ user: userId, is_active: true });
        if (activeGoal) {
            return res.status(400).json({ error: 'You already have an active goal. Delete your current goal before creating a new one.' });
        }

        // Create and save new goal
        const goal = new Goal({
            seance_type,
            goal_type,
            goal_value,
            start_date: startDateObj,
            end_date: endDateObj,
            is_active: true,
            user: userId
        });

        await goal.save();

        res.status(201).json({
            message: 'Goal created successfully',
            goal
        });

    } catch (err) {
        console.error('Error creating goal:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current active goal for the authenticated user
router.get('/active', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const activeGoal = await Goal.findOne({ user: userId, is_active: true });

        if (!activeGoal) {
            return res.status(404).json({ message: 'No active goal found' });
        }

        res.status(200).json({ goal: activeGoal });
    } catch (err) {
        console.error('Error fetching active goal:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get goal history for the authenticated user
router.get('/history', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const goalHistory = await Goal.find(
            { user: userId, is_active: false },
            null,
            { sort: { end_date: -1 } }
        );

        res.status(200).json({ goals: goalHistory });
    } catch (err) {
        console.error('Error fetching goal history:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete the current active goal
router.delete('/active', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find active goal
        const activeGoal = await Goal.findOne({ user: userId, is_active: true });
        
        if (!activeGoal) {
            return res.status(404).json({ error: 'No active goal found' });
        }

        await Goal.deleteOne({ _id: activeGoal._id });
        res.status(200).json({ message: 'Goal deleted successfully' });
    } catch (err) {
        console.error('Error deleting goal:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check goal completion and close expired goals
router.get('/check-progress', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user's active goal
        const activeGoal = await Goal.findOne({ user: userId, is_active: true });
        
        if (!activeGoal) {
            return res.status(200).json({ message: 'No active goal to check' });
        }

        // Check if goal has expired
        const now = new Date();
        const endDate = new Date(activeGoal.end_date);
        
        if (now > endDate) {
            // Goal period has ended, check if achieved
            const startDate = new Date(activeGoal.start_date);
            
            // Get user's seances between start and end dates
            const seances = await Seance.find({
                user: userId,
                type: activeGoal.seance_type,
                date: { $gte: startDate, $lte: endDate }
            });

            // Calculate total based on goal type
            let total = 0;
            if (activeGoal.goal_type === 1) { // Distance
                total = seances.reduce((sum, s) => sum + (s.distance || 0), 0);
            } else if (activeGoal.goal_type === 2) { // Duration
                total = seances.reduce((sum, s) => sum + (s.duration || 0), 0);
            } else if (activeGoal.goal_type === 3) { // Calories
                total = seances.reduce((sum, s) => sum + (s.calories || 0), 0);
            }

            // Update goal status
            const isAchieved = total >= activeGoal.goal_value;
            activeGoal.is_active = false;
            activeGoal.is_achieved = isAchieved;
            await activeGoal.save();

            return res.status(200).json({
                message: 'Goal period has ended',
                isAchieved,
                actual: total,
                target: activeGoal.goal_value,
                goal: activeGoal
            });
        }

        // Goal is still active, calculate current progress
        const startDate = new Date(activeGoal.start_date);
        
        // Get user's seances since start date
        const seances = await Seance.find({
            user: userId,
            type: activeGoal.seance_type,
            date: { $gte: startDate, $lte: now }
        });

        // Calculate progress
        let currentValue = 0;
        if (activeGoal.goal_type === 1) { // Distance
            currentValue = seances.reduce((sum, s) => sum + (s.distance || 0), 0);
        } else if (activeGoal.goal_type === 2) { // Duration
            currentValue = seances.reduce((sum, s) => sum + (s.duration || 0), 0);
        } else if (activeGoal.goal_type === 3) { // Calories
            currentValue = seances.reduce((sum, s) => sum + (s.calories || 0), 0);
        }

        // Calculate percentage and days remaining
        const percentage = (currentValue / activeGoal.goal_value) * 100;
        const daysTotal = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        const daysElapsed = daysTotal - daysRemaining;

        res.status(200).json({
            goal: activeGoal,
            progress: {
                current: currentValue,
                target: activeGoal.goal_value,
                percentage: Math.round(percentage),
                days: {
                    total: daysTotal,
                    elapsed: daysElapsed,
                    remaining: daysRemaining
                },
                isCompleted: currentValue >= activeGoal.goal_value
            }
        });

    } catch (err) {
        console.error('Error checking goal progress:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
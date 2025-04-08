const express = require('express');
const router = express.Router();
const Seance = require('../models/Seance');
const { auth } = require('../middlewares/auth');
const mongoose = require('mongoose');
const statisticsService = require('../services/statisticsService');

// Get weekly statistics for the current user
router.get('/weekly', auth, async (req, res) => {
    try {
        const date = req.query.date ? new Date(req.query.date) : new Date();
        const stats = await statisticsService.getWeeklyStats(req.user.id, date);

        res.json({
            success: true,
            message: "Weekly statistics retrieved successfully",
            data: stats
        });
    } catch (error) {
        console.error('Error retrieving weekly statistics:', error);
        res.status(500).json({
            success: false,
            message: "Error retrieving weekly statistics",
            error: error.message
        });
    }
});

// Get monthly statistics for the current user
router.get('/monthly', auth, async (req, res) => {
    try {
        const date = req.query.date ? new Date(req.query.date) : new Date();
        const stats = await statisticsService.getMonthlyStats(req.user.id, date);

        res.json({
            success: true,
            message: "Monthly statistics retrieved successfully",
            data: stats
        });
    } catch (error) {
        console.error('Error retrieving monthly statistics:', error);
        res.status(500).json({
            success: false,
            message: "Error retrieving monthly statistics",
            error: error.message
        });
    }
});

// Compare two séances (sessions)
router.get('/compare', auth, async (req, res) => {
    try {
        const { seance1, seance2 } = req.query;
        
        if (!seance1 || !seance2) {
            return res.status(400).json({
                success: false,
                message: "Both seance1 and seance2 IDs are required",
            });
        }

        const comparison = await statisticsService.compareSeances(req.user.id, seance1, seance2);
        
        res.json({
            success: true,
            message: "Sessions compared successfully",
            data: comparison
        });
    } catch (error) {
        console.error('Error comparing sessions:', error);
        
        // Handle specific errors
        if (error.message === 'Invalid session ID') {
            return res.status(400).json({
                success: false,
                message: "One or both session IDs are invalid",
                error: error.message
            });
        } else if (error.message === 'One or both sessions not found') {
            return res.status(404).json({
                success: false,
                message: "One or both sessions not found",
                error: error.message
            });
        } else if (error.message === 'Unauthorized access to one or both sessions') {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to compare these sessions",
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Error comparing sessions",
            error: error.message
        });
    }
});

// Get average calories burned per activity type
router.get('/calories-by-activity', auth, async (req, res) => {
    try {
        const stats = await statisticsService.getAverageCaloriesByActivityType(req.user.id);

        res.json({
            success: true,
            message: "Average calories by activity type retrieved successfully",
            data: stats
        });
    } catch (error) {
        console.error('Error retrieving calories by activity type:', error);
        res.status(500).json({
            success: false,
            message: "Error retrieving calories by activity type",
            error: error.message
        });
    }
});

module.exports = router;
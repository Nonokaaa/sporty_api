const mongoose = require('mongoose');
const Seance = require('../models/Seance');

/**
 * Get weekly performance statistics for a user
 * @param {string} userId - The user ID
 * @param {Date} date - Date to calculate the week statistics (default: current date)
 */
exports.getWeeklyStats = async (userId, date = new Date()) => {
    if (typeof date === 'string') {
        date = new Date(date);
    }

    const startOfWeek = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - (date.getDay() || 7) + 1,
        0, 0, 0, 0
    ));

    const endOfWeek = new Date(Date.UTC(
        startOfWeek.getFullYear(),
        startOfWeek.getMonth(),
        startOfWeek.getDate() + 6,
        23, 59, 59, 999
    ));

    // Query sessions for the week
    const sessions = await Seance.find({
        user: userId,
        date: { $gte: startOfWeek, $lte: endOfWeek }
    }).sort({ date: 1 });

    // Calculate statistics
    return calculateStats(sessions);
};

/**
 * Get monthly performance statistics for a user
 * @param {string} userId - The user ID
 * @param {Date} date - Date to calculate the month statistics (default: current date)
 */
exports.getMonthlyStats = async (userId, date = new Date()) => {
    // Calculate start and end of the month
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    // Query sessions for the month
    const sessions = await Seance.find({
        user: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: 1 });

    // Calculate statistics
    return calculateStats(sessions);
};

/**
 * Compare two sessions and calculate the differences
 * @param {string} userId - The user ID
 * @param {string} seance1Id - First seance ID to compare
 * @param {string} seance2Id - Second seance ID to compare
 * @returns {Object} Comparison results
 */
exports.compareSeances = async (userId, seance1Id, seance2Id) => {
    // Validate session IDs
    if (!mongoose.Types.ObjectId.isValid(seance1Id) || !mongoose.Types.ObjectId.isValid(seance2Id)) {
        throw new Error('Invalid session ID');
    }

    // Fetch both sessions
    const seance1 = await Seance.findById(seance1Id);
    const seance2 = await Seance.findById(seance2Id);

    // Check if sessions exist
    if (!seance1 || !seance2) {
        throw new Error('One or both sessions not found');
    }

    // Check if sessions belong to the user
    if (seance1.user.toString() !== userId || seance2.user.toString() !== userId) {
        throw new Error('Unauthorized access to one or both sessions');
    }

    // Calculate differences
    const durationDiff = seance2.duration - seance1.duration;
    const distanceDiff = seance2.distance - seance1.distance;
    const caloriesDiff = seance2.calories - seance1.calories;

    // Format the differences with +/- signs
    const formattedDurationDiff = (durationDiff >= 0 ? "+" : "") + durationDiff;
    const formattedDistanceDiff = (distanceDiff >= 0 ? "+" : "") + distanceDiff;
    const formattedCaloriesDiff = (caloriesDiff >= 0 ? "+" : "") + caloriesDiff;

    return {
        seance1: {
            id: seance1._id,
            type: seance1.type,
            date: seance1.date,
            duration: seance1.duration,
            distance: seance1.distance,
            calories: seance1.calories
        },
        seance2: {
            id: seance2._id,
            type: seance2.type,
            date: seance2.date,
            duration: seance2.duration,
            distance: seance2.distance,
            calories: seance2.calories
        },
        comparison: {
            duration: formattedDurationDiff,
            distance: formattedDistanceDiff,
            calories: formattedCaloriesDiff
        }
    };
};

/**
 * Get average calories burned per activity type
 * @param {string} userId - The user ID
 * @returns {Object} Average calories per activity type
 */
exports.getAverageCaloriesByActivityType = async (userId) => {
    // Build the query for all user sessions
    const query = { user: userId };
    
    // Get all sessions for the user
    const sessions = await Seance.find(query);
    
    // Initialize counters for each activity type
    const activityTypes = {
        1: { name: 'Course', totalCalories: 0, sessionCount: 0, averageCalories: 0 },
        2: { name: 'Vélo', totalCalories: 0, sessionCount: 0, averageCalories: 0 },
        3: { name: 'Musculation', totalCalories: 0, sessionCount: 0, averageCalories: 0 }
    };
    
    // Calculate totals for each activity type
    sessions.forEach(session => {
        const type = session.type;
        
        if (activityTypes[type]) {
            activityTypes[type].totalCalories += session.calories;
            activityTypes[type].sessionCount++;
        }
    });
    
    // Calculate averages
    Object.keys(activityTypes).forEach(type => {
        if (activityTypes[type].sessionCount > 0) {
            activityTypes[type].averageCalories = 
                Math.round((activityTypes[type].totalCalories / activityTypes[type].sessionCount) * 100) / 100;
        }
    });
    
    return {
        course: activityTypes[1],
        velo: activityTypes[2], 
        musculation: activityTypes[3],
        summary: {
            totalSessions: sessions.length,
            totalCaloriesBurned: sessions.reduce((sum, session) => sum + session.calories, 0)
        }
    };
};

/**
 * Helper function to calculate statistics from a set of sessions
 * @param {Array} sessions - Array of session documents
 */
const calculateStats = (sessions) => {
    if (!sessions.length) {
        return {
            totalSessions: 0,
            totalDuration: 0,
            totalDistance: 0,
            totalCalories: 0,
            averageDuration: 0,
            averageDistance: 0,
            averageCalories: 0,
        };
    }

    let totalDuration = 0;
    let totalDistance = 0;
    let totalCalories = 0;

    sessions.forEach(session => {
        totalDuration += session.duration || 0;
        totalDistance += session.distance || 0;
        totalCalories += session.calories || 0;
    });

    // Calculate averages and round to 2 decimal places
    const averageDuration = Math.round((totalDuration / sessions.length) * 100) / 100;
    const averageDistance = Math.round((totalDistance / sessions.length) * 100) / 100;
    const averageCalories = Math.round((totalCalories / sessions.length) * 100) / 100;

    return {
        totalSessions: sessions.length,
        totalDuration,
        totalDistance,
        totalCalories,
        averageDuration,
        averageDistance,
        averageCalories,
    };
};

exports.calculateStats = calculateStats;
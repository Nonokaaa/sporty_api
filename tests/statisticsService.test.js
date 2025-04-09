const request = require('supertest');
const mongoose = require('mongoose');
const statisticsService = require('../services/statisticsService');
const Seance = require('../models/Seance');
const User = require('../models/User');
const app = require('../app');

describe('Statistics Service', () => {
    afterAll(async () => {
        await mongoose.connection.close();
    });
    describe('calculateStats', () => {
        it('should calculate the correct statistics from sessions', () => {
            const sessions = [
                { duration: 120, distance: 3000, calories: 54 },
                { duration: 150, distance: 4000, calories: 70 },
                { duration: 90, distance: 2500, calories: 40 },
                { duration: 180, distance: 5000, calories: 90 },
            ];

            const stats = statisticsService.calculateStats(sessions);

            expect(stats).toEqual({
                totalSessions: 4,
                totalDuration: 540,
                totalDistance: 14500,
                totalCalories: 254,
                averageDuration: 135,
                averageDistance: 3625,
                averageCalories: 63.5,
            });
        });

        it('should return zeros for empty sessions array', () => {
            const sessions = [];

            const stats = statisticsService.calculateStats(sessions);

            expect(stats).toEqual({
                totalSessions: 0,
                totalDuration: 0,
                totalDistance: 0,
                totalCalories: 0,
                averageDuration: 0,
                averageDistance: 0,
                averageCalories: 0,
            });
        });
    });

    describe('getWeeklyStats', () => {
        beforeEach(async () => {
            await User.deleteMany();
            await Seance.deleteMany();
        });

        it('should return weekly statistics for a user', async () => {
            const user = new User({ email: 'stats@example.com', password: 'password123' });
            await user.save();

            const sessions = [
                new Seance({ type: 1, duration: 120, distance: 3000, calories: 54, user: user._id }),
                new Seance({ type: 2, duration: 150, distance: 4000, calories: 70, user: user._id }),
                new Seance({ type: 3, duration: 90, distance: 2500, calories: 40, user: user._id }),
            ]
            await Seance.insertMany(sessions);

            const stats = await statisticsService.getWeeklyStats(user._id);
            expect(stats).toEqual ({
                totalSessions: 3,
                totalDuration: 360,
                totalDistance: 9500,
                totalCalories: 164,
                averageDuration: 120,
                averageDistance: 3166.67,
                averageCalories: 54.67,
            });
        });
        it('should return zero stats when user has no sessions', async () => {
            const user = new User({ email: 'nostats@example.com', password: 'password123' });
            await user.save();
            
            const stats = await statisticsService.getWeeklyStats(user._id);
            
            expect(stats).toEqual({
                totalSessions: 0,
                totalDuration: 0,
                totalDistance: 0,
                totalCalories: 0,
                averageDuration: 0,
                averageDistance: 0,
                averageCalories: 0,
            });
        });
        it('should return zero stats when all sessions are outside the weekly range', async () => {
            const user = new User({ email: 'oldstats@example.com', password: 'password123' });
            await user.save();
            
            const sessions = [
                new Seance({ type: 1, duration: 120, distance: 3000, calories: 54, user: user._id, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) }), // 8 days ago
                new Seance({ type: 2, duration: 150, distance: 4000, calories: 70, user: user._id, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }), // 10 days ago
            ];
            await Seance.insertMany(sessions);
            
            const stats = await statisticsService.getWeeklyStats(user._id);
            
            expect(stats).toEqual({
                totalSessions: 0,
                totalDuration: 0,
                totalDistance: 0,
                totalCalories: 0,
                averageDuration: 0,
                averageDistance: 0,
                averageCalories: 0,
            });
        });
        it('should only count sessions from the last 7 days', async () => {
            const user = new User({ email: 'mixstats@example.com', password: 'password123' });
            await user.save();
            
            const currentDate = new Date();
            const sessions = [
                new Seance({ type: 1, duration: 100, distance: 2000, calories: 50, user: user._id }), // Today
                new Seance({ type: 2, duration: 200, distance: 3000, calories: 60, user: user._id }), // Today
                // Outside 7 days
                new Seance({ type: 3, duration: 300, distance: 4000, calories: 70, user: user._id, date: new Date(currentDate.getTime() - 8 * 24 * 60 * 60 * 1000) }), // 8 days ago
                new Seance({ type: 1, duration: 400, distance: 5000, calories: 80, user: user._id, date: new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000) }), // 14 days ago
            ];
            await Seance.insertMany(sessions);
            
            const stats = await statisticsService.getWeeklyStats(user._id);
            
            expect(stats).toEqual({
                totalSessions: 2,
                totalDuration: 300,
                totalDistance: 5000,
                totalCalories: 110,
                averageDuration: 150,
                averageDistance: 2500,
                averageCalories: 55,
            });
        });
    });
    describe('getMonthlyStats', () => {
        beforeEach(async () => {
            await User.deleteMany();
            await Seance.deleteMany();
        });

        it('should return monthly statistics for a user', async () => {
            const user = new User({ email: 'stats@example.com', password: 'password123' });
            await user.save();

            const sessions = [
                new Seance({ type: 1, duration: 120, distance: 3000, calories: 54, user: user._id }),
                new Seance({ type: 2, duration: 150, distance: 4000, calories: 70, user: user._id }),
                new Seance({ type: 3, duration: 90, distance: 2500, calories: 40, user: user._id }),
            ]
            await Seance.insertMany(sessions);

            const stats = await statisticsService.getMonthlyStats(user._id);
            expect(stats).toEqual ({
                totalSessions: 3,
                totalDuration: 360,
                totalDistance: 9500,
                totalCalories: 164,
                averageDuration: 120,
                averageDistance: 3166.67,
                averageCalories: 54.67,
            });
        });
        
        it('should return zero stats when user has no sessions', async () => {
            const user = new User({ email: 'nostats_monthly@example.com', password: 'password123' });
            await user.save();
            
            const stats = await statisticsService.getMonthlyStats(user._id);
            
            expect(stats).toEqual({
                totalSessions: 0,
                totalDuration: 0,
                totalDistance: 0,
                totalCalories: 0,
                averageDuration: 0,
                averageDistance: 0,
                averageCalories: 0,
            });
        });

        it('should return zero stats when all sessions are outside the monthly range', async () => {
            const user = new User({ email: 'oldstats_monthly@example.com', password: 'password123' });
            await user.save();
            
            const sessions = [
                new Seance({ type: 1, duration: 120, distance: 3000, calories: 54, user: user._id, date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000) }), // 32 days ago
                new Seance({ type: 2, duration: 150, distance: 4000, calories: 70, user: user._id, date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) }), // 40 days ago
            ];
            await Seance.insertMany(sessions);
            
            const stats = await statisticsService.getMonthlyStats(user._id);
            
            expect(stats).toEqual({
                totalSessions: 0,
                totalDuration: 0,
                totalDistance: 0,
                totalCalories: 0,
                averageDuration: 0,
                averageDistance: 0,
                averageCalories: 0,
            });
        });

        it('should only count sessions from the last 30 days', async () => {
            const user = new User({ email: 'mixstats_monthly@example.com', password: 'password123' });
            await user.save();
            
            const currentDate = new Date();
            const sessions = [
                // Within 30 days
                new Seance({ type: 1, duration: 100, distance: 2000, calories: 50, user: user._id }), // Today
                new Seance({ type: 2, duration: 200, distance: 3000, calories: 60, user: user._id }), // Today
                new Seance({ type: 3, duration: 150, distance: 2500, calories: 45, user: user._id }), // Today
                // Outside 30 days
                new Seance({ type: 2, duration: 300, distance: 4000, calories: 70, user: user._id, date: new Date(currentDate.getTime() - 31 * 24 * 60 * 60 * 1000) }), // 31 days ago
                new Seance({ type: 1, duration: 400, distance: 5000, calories: 80, user: user._id, date: new Date(currentDate.getTime() - 45 * 24 * 60 * 60 * 1000) }), // 45 days ago
            ];
            await Seance.insertMany(sessions);
            
            const stats = await statisticsService.getMonthlyStats(user._id);
            
            expect(stats).toEqual({
                totalSessions: 3,
                totalDuration: 450,
                totalDistance: 7500,
                totalCalories: 155,
                averageDuration: 150,
                averageDistance: 2500,
                averageCalories: 51.67,
            });
        });

        it('should handle invalid user ID gracefully', async () => {
            const invalidUserId = new mongoose.Types.ObjectId();
            
            const stats = await statisticsService.getMonthlyStats(invalidUserId);
            
            expect(stats).toEqual({
                totalSessions: 0,
                totalDuration: 0,
                totalDistance: 0,
                totalCalories: 0,
                averageDuration: 0,
                averageDistance: 0,
                averageCalories: 0,
            });
        });
    });

    describe('compareSeances', () => {
        beforeEach(async () => {
            await User.deleteMany();
            await Seance.deleteMany();
        });
        
        it('should correctly compare two seances', async () => {
            // Create a user
            const user = new User({ email: 'compare@example.com', password: 'password123' });
            await user.save();
            
            // Create two seances to compare
            const seance1 = new Seance({ type: 1, duration: 100, distance: 2000, calories: 50, user: user._id, date: new Date('2025-04-01') });
            const seance2 = new Seance({ type: 1, duration: 120, distance: 2500, calories: 65, user: user._id, date: new Date('2025-04-05') });
            
            await seance1.save();
            await seance2.save();
            
            // Compare the seances
            const comparison = await statisticsService.compareSeances(
                user._id.toString(), 
                seance1._id.toString(), 
                seance2._id.toString()
            );
            
            // Verify comparison results
            expect(comparison).toHaveProperty('seance1');
            expect(comparison).toHaveProperty('seance2');
            expect(comparison).toHaveProperty('comparison');
            
            expect(comparison.comparison).toEqual({
                duration: '+20',   // 120 - 100
                distance: '+500',  // 2500 - 2000
                calories: '+15'    // 65 - 50
            });
            
            expect(comparison.seance1.id.toString()).toEqual(seance1._id.toString());
            expect(comparison.seance2.id.toString()).toEqual(seance2._id.toString());
        });
        
        it('should throw error for invalid seance IDs', async () => {
            const user = new User({ email: 'invalid@example.com', password: 'password123' });
            await user.save();
            
            await expect(statisticsService.compareSeances(
                user._id.toString(),
                'invalid-id',
                'another-invalid-id'
            )).rejects.toThrow('Invalid session ID');
        });
        
        it('should throw error when seances are not found', async () => {
            const user = new User({ email: 'notfound@example.com', password: 'password123' });
            await user.save();
            
            const nonExistentId1 = new mongoose.Types.ObjectId();
            const nonExistentId2 = new mongoose.Types.ObjectId();
            
            await expect(statisticsService.compareSeances(
                user._id.toString(),
                nonExistentId1.toString(),
                nonExistentId2.toString()
            )).rejects.toThrow('One or both sessions not found');
        });
        
        it('should throw error for unauthorized access', async () => {
            // Create two users
            const user1 = new User({ email: 'user1@example.com', password: 'password123' });
            const user2 = new User({ email: 'user2@example.com', password: 'password123' });
            await user1.save();
            await user2.save();
            
            // Create a seance for each user
            const seance1 = new Seance({ type: 1, duration: 100, distance: 2000, calories: 50, user: user1._id });
            const seance2 = new Seance({ type: 1, duration: 120, distance: 2500, calories: 65, user: user2._id });
            
            await seance1.save();
            await seance2.save();
            
            // User1 trying to access a seance belonging to user2
            await expect(statisticsService.compareSeances(
                user1._id.toString(),
                seance1._id.toString(),
                seance2._id.toString()
            )).rejects.toThrow('Unauthorized access to one or both sessions');
        });
        
        it('should handle negative differences correctly', async () => {
            // Create a user
            const user = new User({ email: 'negative@example.com', password: 'password123' });
            await user.save();
            
            // Create two seances where second has lower values
            const seance1 = new Seance({ type: 1, duration: 150, distance: 3000, calories: 70, user: user._id });
            const seance2 = new Seance({ type: 1, duration: 100, distance: 2000, calories: 50, user: user._id });
            
            await seance1.save();
            await seance2.save();
            
            // Compare the seances
            const comparison = await statisticsService.compareSeances(
                user._id.toString(), 
                seance1._id.toString(), 
                seance2._id.toString()
            );
            
            // Verify negative differences
            expect(comparison.comparison).toEqual({
                duration: '-50',   // 100 - 150
                distance: '-1000', // 2000 - 3000
                calories: '-20'    // 50 - 70
            });
        });
    });
    
    describe('getAverageCaloriesByActivityType', () => {
        beforeEach(async () => {
            await User.deleteMany();
            await Seance.deleteMany();
        });
        
        it('should calculate average calories by activity type', async () => {
            // Create a user
            const user = new User({ email: 'calories@example.com', password: 'password123' });
            await user.save();
            
            // Create sessions of different types
            const sessions = [
                // Running (type 1)
                new Seance({ type: 1, duration: 100, distance: 2000, calories: 50, user: user._id }),
                new Seance({ type: 1, duration: 120, distance: 2500, calories: 60, user: user._id }),
                
                // Cycling (type 2)
                new Seance({ type: 2, duration: 200, distance: 5000, calories: 80, user: user._id }),
                new Seance({ type: 2, duration: 250, distance: 6000, calories: 100, user: user._id }),
                new Seance({ type: 2, duration: 180, distance: 4500, calories: 70, user: user._id }),
                
                // Weight Training (type 3)
                new Seance({ type: 3, duration: 60, distance: 0, calories: 40, user: user._id }),
            ];
            
            await Seance.insertMany(sessions);
            
            // Get average calories by activity type
            const stats = await statisticsService.getAverageCaloriesByActivityType(user._id);
            
            // Verify results
            expect(stats).toHaveProperty('course');
            expect(stats).toHaveProperty('velo');
            expect(stats).toHaveProperty('musculation');
            expect(stats).toHaveProperty('summary');
            
            // Running stats (2 sessions)
            expect(stats.course.averageCalories).toBe(55);
            expect(stats.course.sessionCount).toBe(2);
            expect(stats.course.totalCalories).toBe(110);
            
            // Cycling stats (3 sessions)
            expect(stats.velo.averageCalories).toBe(83.33);
            expect(stats.velo.sessionCount).toBe(3);
            expect(stats.velo.totalCalories).toBe(250);
            
            // Weight Training stats (1 session)
            expect(stats.musculation.averageCalories).toBe(40);
            expect(stats.musculation.sessionCount).toBe(1);
            expect(stats.musculation.totalCalories).toBe(40);
            
            // Summary
            expect(stats.summary.totalSessions).toBe(6);
            expect(stats.summary.totalCaloriesBurned).toBe(400); // Sum of all calories
        });
        
        it('should return zeros for activity types with no sessions', async () => {
            // Create a user
            const user = new User({ email: 'partial@example.com', password: 'password123' });
            await user.save();
            
            // Create sessions of only type 1 (running)
            const sessions = [
                new Seance({ type: 1, duration: 100, distance: 2000, calories: 50, user: user._id }),
                new Seance({ type: 1, duration: 120, distance: 2500, calories: 60, user: user._id }),
            ];
            
            await Seance.insertMany(sessions);
            
            // Get average calories by activity type
            const stats = await statisticsService.getAverageCaloriesByActivityType(user._id);
            
            // Verify results
            // Running stats (2 sessions)
            expect(stats.course.averageCalories).toBe(55);
            expect(stats.course.sessionCount).toBe(2);
            
            // Cycling stats (0 sessions)
            expect(stats.velo.averageCalories).toBe(0);
            expect(stats.velo.sessionCount).toBe(0);
            
            // Weight Training stats (0 sessions)
            expect(stats.musculation.averageCalories).toBe(0);
            expect(stats.musculation.sessionCount).toBe(0);
            
            // Summary
            expect(stats.summary.totalSessions).toBe(2);
            expect(stats.summary.totalCaloriesBurned).toBe(110);
        });
        
        it('should return zero stats when user has no sessions', async () => {
            // Create a user with no sessions
            const user = new User({ email: 'nosessions@example.com', password: 'password123' });
            await user.save();
            
            // Get average calories by activity type
            const stats = await statisticsService.getAverageCaloriesByActivityType(user._id);
            
            // Verify results - all zeros
            expect(stats.course.averageCalories).toBe(0);
            expect(stats.course.sessionCount).toBe(0);
            expect(stats.course.totalCalories).toBe(0);
            
            expect(stats.velo.averageCalories).toBe(0);
            expect(stats.velo.sessionCount).toBe(0);
            expect(stats.velo.totalCalories).toBe(0);
            
            expect(stats.musculation.averageCalories).toBe(0);
            expect(stats.musculation.sessionCount).toBe(0);
            expect(stats.musculation.totalCalories).toBe(0);
            
            expect(stats.summary.totalSessions).toBe(0);
            expect(stats.summary.totalCaloriesBurned).toBe(0);
        });
        
        it('should handle non-existent user ID gracefully', async () => {
            // Create a non-existent user ID
            const nonExistentId = new mongoose.Types.ObjectId();
            
            // Get average calories by activity type
            const stats = await statisticsService.getAverageCaloriesByActivityType(nonExistentId);
            
            // Verify results - all zeros
            expect(stats.course.averageCalories).toBe(0);
            expect(stats.course.sessionCount).toBe(0);
            expect(stats.velo.sessionCount).toBe(0);
            expect(stats.musculation.sessionCount).toBe(0);
            expect(stats.summary.totalSessions).toBe(0);
        });
    });
});
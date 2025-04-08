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
});

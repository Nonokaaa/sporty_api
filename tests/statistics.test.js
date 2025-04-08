const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Seance = require('../models/Seance');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Statistics Routes', () => {
    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('GET /weekly', () => {
        let user;
        let token;

        beforeEach(async () => {
            await User.deleteMany();
            await Seance.deleteMany();

            user = new User({ email: 'statsweekly@example.com', password: 'password123' });
            await user.save();
            token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });

            // Create seances for the user
            const seances = [
                // Within 7 days
                new Seance({ type: 1, duration: 120, distance: 3000, calories: 54, user: user._id }),
                new Seance({ type: 2, duration: 150, distance: 4000, calories: 70, user: user._id }),
                new Seance({ type: 3, duration: 90, distance: 2500, calories: 40, user: user._id }),
                // Outside 7 days
                new Seance({ type: 2, duration: 180, distance: 5000, calories: 90, user: user._id, date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) }), // 9 days ago
            ];
            await Seance.insertMany(seances);
        });

        it('should return weekly statistics for the authenticated user', async () => {
            const response = await request(app).get('/statistics/weekly').set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Weekly statistics retrieved successfully');
            expect(response.body.data).toEqual({
                totalSessions: 3,
                totalDuration: 360,
                totalDistance: 9500,
                totalCalories: 164,
                averageDuration: 120,
                averageDistance: 3166.67,
                averageCalories: 54.67,
            });
        });

        it('should return zero stats when user has no sessions in the week', async () => {
            await Seance.deleteMany({ user: user._id });

            const response = await request(app).get('/statistics/weekly').set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual({
                totalSessions: 0,
                totalDuration: 0,
                totalDistance: 0,
                totalCalories: 0,
                averageDuration: 0,
                averageDistance: 0,
                averageCalories: 0,
            });
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app).get('/statistics/weekly');
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });

        it('should return 401 if token is invalid', async () => {
            const response = await request(app).get('/statistics/weekly').set('Authorization', 'Bearer invalidtoken');
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });
    });

    describe('GET /monthly', () => {
        let user;
        let token;

        beforeEach(async () => {
            await User.deleteMany();
            await Seance.deleteMany();

            user = new User({ email: 'statsmonthly@example.com', password: 'password123' });
            await user.save();
            token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });

            const seances = [
                new Seance({ type: 1, duration: 100, distance: 2000, calories: 50, user: user._id }),
                new Seance({ type: 2, duration: 200, distance: 3000, calories: 60, user: user._id }),
                new Seance({ type: 3, duration: 150, distance: 2500, calories: 45, user: user._id }),
                // Outside 30 days
                new Seance({ type: 2, duration: 300, distance: 4000, calories: 70, user: user._id, date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) }), // 35 days ago
            ];
            await Seance.insertMany(seances);
        });

        it('should return monthly statistics for the authenticated user', async () => {
            const response = await request(app).get('/statistics/monthly').set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Monthly statistics retrieved successfully');
            expect(response.body.data).toEqual({
                totalSessions: 3,
                totalDuration: 450,
                totalDistance: 7500,
                totalCalories: 155,
                averageDuration: 150,
                averageDistance: 2500,
                averageCalories: 51.67,
            });
        });

        it('should return zero stats when user has no sessions in the month', async () => {
            await Seance.deleteMany({ user: user._id });
            const response = await request(app).get('/statistics/monthly').set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual({
                totalSessions: 0,
                totalDuration: 0,
                totalDistance: 0,
                totalCalories: 0,
                averageDuration: 0,
                averageDistance: 0,
                averageCalories: 0,
            });
        });

        it('should return statistics for a specific month', async () => {
            // Create past seances that would be included in a specific month
            await Seance.deleteMany({ user: user._id });

            const pastSeances = [
                new Seance({ type: 1, duration: 110, distance: 2200, calories: 55, user: user._id, date: new Date(2023, 7, 5) }), // August 5, 2023
                new Seance({ type: 2, duration: 130, distance: 2700, calories: 65, user: user._id, date: new Date(2023, 7, 15) }), // August 15, 2023
            ];
            await Seance.insertMany(pastSeances);
            const response = await request(app).get('/statistics/monthly?date=2023-08-10').set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalSessions).toBe(2);
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app).get('/statistics/monthly');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });

        it('should return 401 if token is invalid', async () => {
            const response = await request(app).get('/statistics/monthly').set('Authorization', 'Bearer invalidtoken');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });
    });
});
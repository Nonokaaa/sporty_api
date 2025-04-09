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

    describe('GET /compare', () => {
        let user;
        let token;
        let seance1;
        let seance2;

        beforeEach(async () => {
            await User.deleteMany();
            await Seance.deleteMany();

            user = new User({ email: 'comparetest@example.com', password: 'password123' });
            await user.save();
            token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });

            // Create two seances for comparison
            seance1 = new Seance({ type: 1, duration: 100, distance: 2000, calories: 50, user: user._id, date: new Date('2025-04-01') });
            await seance1.save();

            seance2 = new Seance({ type: 1, duration: 120, distance: 2500, calories: 65, user: user._id, date: new Date('2025-04-05') });
            await seance2.save();
        });

        it('should compare two sessions successfully', async () => {
            const response = await request(app)
                .get(`/statistics/compare?seance1=${seance1._id}&seance2=${seance2._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Sessions compared successfully');
            
            const { data } = response.body;
            expect(data).toHaveProperty('seance1');
            expect(data).toHaveProperty('seance2');
            expect(data).toHaveProperty('comparison');
            
            expect(data.comparison).toEqual({
                duration: '+20',
                distance: '+500',
                calories: '+15'
            });
        });

        it('should return 400 if seance IDs are not provided', async () => {
            const response = await request(app)
                .get('/statistics/compare')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Both seance1 and seance2 IDs are required');
        });

        it('should return 400 if one seance ID is invalid', async () => {
            const response = await request(app)
                .get(`/statistics/compare?seance1=invalid-id&seance2=${seance2._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('One or both session IDs are invalid');
        });

        it('should return 404 if a seance is not found', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/statistics/compare?seance1=${nonExistentId}&seance2=${seance2._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('One or both sessions not found');
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .get(`/statistics/compare?seance1=${seance1._id}&seance2=${seance2._id}`);
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });

        it('should handle unauthorized access to sessions', async () => {
            // Create another user
            const anotherUser = new User({ email: 'another@example.com', password: 'password123' });
            await anotherUser.save();
            
            // Create a seance for this user
            const otherSeance = new Seance({ type: 1, duration: 90, distance: 1800, calories: 45, user: anotherUser._id });
            await otherSeance.save();
            
            // Try to compare seance from other user with user's own seance
            const response = await request(app)
                .get(`/statistics/compare?seance1=${seance1._id}&seance2=${otherSeance._id}`)
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You don\'t have permission to compare these sessions');
        });
    });

    describe('GET /calories-by-activity', () => {
        let user;
        let token;

        beforeEach(async () => {
            await User.deleteMany();
            await Seance.deleteMany();

            user = new User({ email: 'caloriestest@example.com', password: 'password123' });
            await user.save();
            token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });

            // Create sessions with different activity types
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
        });

        it('should return calories statistics by activity type', async () => {
            const response = await request(app)
                .get('/statistics/calories-by-activity')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Average calories by activity type retrieved successfully');
            
            const { data } = response.body;
            
            // Check structure
            expect(data).toHaveProperty('course');
            expect(data).toHaveProperty('velo');
            expect(data).toHaveProperty('musculation');
            expect(data).toHaveProperty('summary');
            
            // Verify calculations
            expect(data.course.sessionCount).toBe(2);
            expect(data.course.averageCalories).toBe(55);
            
            expect(data.velo.sessionCount).toBe(3);
            expect(data.velo.averageCalories).toBe(83.33);
            
            expect(data.musculation.sessionCount).toBe(1);
            expect(data.musculation.averageCalories).toBe(40);
            
            expect(data.summary.totalSessions).toBe(6);
            expect(data.summary.totalCaloriesBurned).toBe(400);
        });

        it('should return empty statistics when user has no sessions', async () => {
            // Create a new user with no sessions
            const emptyUser = new User({ email: 'emptyuser@example.com', password: 'password123' });
            await emptyUser.save();
            const emptyToken = jwt.sign({ id: emptyUser._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
            
            const response = await request(app)
                .get('/statistics/calories-by-activity')
                .set('Authorization', `Bearer ${emptyToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const { data } = response.body;
            expect(data.course.sessionCount).toBe(0);
            expect(data.course.averageCalories).toBe(0);
            expect(data.velo.sessionCount).toBe(0);
            expect(data.musculation.sessionCount).toBe(0);
            expect(data.summary.totalSessions).toBe(0);
            expect(data.summary.totalCaloriesBurned).toBe(0);
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app).get('/statistics/calories-by-activity');
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });

        it('should return 401 if token is invalid', async () => {
            const response = await request(app)
                .get('/statistics/calories-by-activity')
                .set('Authorization', 'Bearer invalidtoken');
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });
    });
});
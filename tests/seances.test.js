const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Seance = require('../models/Seance');
const User = require('../models/User');



describe('POST /create', () => {
    afterEach(async () => {
        // Clean up the database after each test
        await Seance.deleteMany();
        await User.deleteMany();
    });
    let userID;
    beforeEach(async () => {
        const user = new User({ email: 'seance@example.com', password: 'password123' });
        await user.save();
        userID = user._id.toString();
    });

    it('should create a new seance successfully', async () => {
        const validSeance = {
            type: 1,
            duration: 60,
            distance: 10,
            calories: 500,
            user: userID
        };

        const response = await request(app).post('/seances/create').send(validSeance);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id');
        expect(response.body.type).toBe(validSeance.type);
        expect(response.body.duration).toBe(validSeance.duration);
        expect(response.body.distance).toBe(validSeance.distance);
        expect(response.body.calories).toBe(validSeance.calories);
        expect(response.body.user).toBe(validSeance.user);
    });

    it('should return 400 if type is missing', async () => {
        const invalidSeance = {
            duration: 60,
            distance: 10,
            calories: 500,
            user: userID
        };

        const response = await request(app).post('/seances/create').send(invalidSeance);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Type is required');
    });

    // it('should return 400 if type is invalid', async () => {
    //     const invalidSeance = {
    //         type: 4,
    //         duration: 60,
    //         distance: 10,
    //         calories: 500,
    //         user: userID
    //     };

    //     const response = await request(app).post('/seances/create').send(invalidSeance);

    //     expect(response.status).toBe(400);
    //     expect(response.body.error).toBe('Type must be 1 (Course), 2 (Vélo), or 3 (Musculation)');
    // });

    // it('should return 400 if duration is missing', async () => {
    //     const invalidSeance = {
    //         type: 1,
    //         distance: 10,
    //         calories: 500,
    //         user: '64f1a2b3c4d5e6f7g8h9i0j1'
    //     };

    //     const response = await request(app).post('/create').send(invalidSeance);

    //     expect(response.status).toBe(400);
    //     expect(response.body.error).toBe('Duration is required');
    // });

    // it('should return 400 if duration is not a number', async () => {
    //     const invalidSeance = {
    //         type: 1,
    //         duration: 'sixty',
    //         distance: 10,
    //         calories: 500,
    //         user: '64f1a2b3c4d5e6f7g8h9i0j1'
    //     };

    //     const response = await request(app).post('/create').send(invalidSeance);

    //     expect(response.status).toBe(400);
    //     expect(response.body.error).toBe('Duration must be a number');
    // });

    // it('should return 400 if distance is missing', async () => {
    //     const invalidSeance = {
    //         type: 1,
    //         duration: 60,
    //         calories: 500,
    //         user: '64f1a2b3c4d5e6f7g8h9i0j1'
    //     };

    //     const response = await request(app).post('/create').send(invalidSeance);

    //     expect(response.status).toBe(400);
    //     expect(response.body.error).toBe('Distance is required');
    // });

    // it('should return 400 if calories are missing', async () => {
    //     const invalidSeance = {
    //         type: 1,
    //         duration: 60,
    //         distance: 10,
    //         user: '64f1a2b3c4d5e6f7g8h9i0j1'
    //     };

    //     const response = await request(app).post('/create').send(invalidSeance);

    //     expect(response.status).toBe(400);
    //     expect(response.body.error).toBe('Calories are required');
    // });

    // it('should return 400 if user is missing', async () => {
    //     const invalidSeance = {
    //         type: 1,
    //         duration: 60,
    //         distance: 10,
    //         calories: 500
    //     };

    //     const response = await request(app).post('/create').send(invalidSeance);

    //     expect(response.status).toBe(400);
    //     expect(response.body.error).toBe('User must be logged in');
    // });

    // it('should return 404 if user is not found', async () => {
    //     const invalidSeance = {
    //         type: 1,
    //         duration: 60,
    //         distance: 10,
    //         calories: 500,
    //         user: 'nonexistentuserid'
    //     };

    //     const response = await request(app).post('/create').send(invalidSeance);

    //     expect(response.status).toBe(404);
    //     expect(response.body.error).toBe('User not found');
    // });

    // it('should return 500 if there is a server error', async () => {
    //     jest.spyOn(User, 'findById').mockImplementationOnce(() => {
    //         throw new Error('Database error');
    //     });

    //     const validSeance = {
    //         type: 1,
    //         duration: 60,
    //         distance: 10,
    //         calories: 500,
    //         user: '64f1a2b3c4d5e6f7g8h9i0j1'
    //     };

    //     const response = await request(app).post('/create').send(validSeance);

    //     expect(response.status).toBe(500);
    //     expect(response.body.error).toBe('Internal server error');
    // });
});
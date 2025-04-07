const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');


describe('User Routes', () => {
    describe('POST /register', () => {
        afterAll(async () => {
            await User.deleteMany();
        });
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/users/register')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('email', 'test@example.com');
        });

        it('should return an error if email is missing', async () => {
            const response = await request(app)
                .post('/users/register')
                .send({ password: 'password123' });

            expect(response.status).toBe(400); // Adjust based on your validation logic
            expect(response.body).toHaveProperty('error', 'Email is required');
        });

        it('should return an error if password is missing', async () => {
            const response = await request(app)
                .post('/users/register')
                .send({ email: 'test@example' });

            expect(response.status).toBe(400); // Adjust based on your validation logic
            expect(response.body).toHaveProperty('error', 'Password is required');
        });
    });

    describe('POST /login', () => {
        beforeAll(async () => {
            // Create a user for login tests
            const user = new User({ email: 'test@example.com', password: 'password123' });
            await user.save();
        });

        afterAll(async () => {
            // Clean up the database after all tests
            await User.deleteMany();
        });

        it('should log in an existing user with correct credentials', async () => {
            const response = await request(app)
                .post('/users/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body.user).toHaveProperty('email', 'test@example.com');
        });

        it('should return an error for invalid credentials', async () => {
            const response = await request(app)
                .post('/users/login')
                .send({ email: 'test@example.com', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should return an error if the user does not exist', async () => {
            const response = await request(app)
                .post('/users/login')
                .send({ email: 'nonexistent@example.com', password: 'password123' });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });
    });
});
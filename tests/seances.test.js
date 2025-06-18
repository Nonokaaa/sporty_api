const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Seance = require('../models/Seance');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Seance Route', () => {
    afterAll(async () => {
        await mongoose.connection.close();
    });
    describe('POST /', () => {
        afterEach(async () => {
            // Clean up the database after each test
            await Seance.deleteMany();
            await User.deleteMany();
        });
        let token;
        beforeEach(async () => {
            const user = new User({ email: 'seance@example.com', username: 'seanceuser', password: 'password123' });
            await user.save();

            token = jwt.sign({ id: user._id, email: user.email, username: user.username }, process.env.JWT_SECRET, { expiresIn: '3h' });

        });

        it('should create a new seance successfully', async () => {
            const validSeance = {
                type: 1,
                duration: 60,
                distance: 10,
                calories: 500
            };

            const response = await 
            request(app)
            .post('/seances')
            .set("Authorization", `Bearer ${token}`)
            .send(validSeance);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.type).toBe(validSeance.type);
            expect(response.body.duration).toBe(validSeance.duration);
            expect(response.body.distance).toBe(validSeance.distance);
            expect(response.body.calories).toBe(validSeance.calories);
        });

        it('should return 400 if type is missing', async () => {
            const invalidSeance = {
                duration: 60,
                distance: 10,
                calories: 500        
            };

            const response = await request(app).post('/seances').set("Authorization", `Bearer ${token}`).send(invalidSeance);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Type is required');
        });

        it('should return 400 if type is invalid', async () => {
            const invalidSeance = {
                type: 4,
                duration: 60,
                distance: 10,
                calories: 500,
            };

            const response = await request(app).post('/seances').set("Authorization", `Bearer ${token}`).send(invalidSeance);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Type must be 1 (Course), 2 (Vélo), or 3 (Musculation)');
        });

        it('should return 400 if duration is missing', async () => {
            const invalidSeance = {
                type: 1,
                distance: 10,
                calories: 500,
            };

            const response = await request(app).post('/seances').set("Authorization", `Bearer ${token}`).send(invalidSeance);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Duration is required');
        });

        it('should return 400 if duration is not a number', async () => {
            const invalidSeance = {
                type: 1,
                duration: 'sixty',
                distance: 10,
                calories: 500,
            };

            const response = await request(app).post('/seances').set("Authorization", `Bearer ${token}`).send(invalidSeance);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Duration must be a number');
        });

        it('should return 400 if distance is missing', async () => {
            const invalidSeance = {
                type: 1,
                duration: 60,
                calories: 500,
            };

            const response = await request(app).post('/seances').set("Authorization", `Bearer ${token}`).send(invalidSeance);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Distance is required');
        });

        it('should return 400 if calories are missing', async () => {
            const invalidSeance = {
                type: 1,
                duration: 60,
                distance: 10,
            };

            const response = await request(app).post('/seances').set("Authorization", `Bearer ${token}`).send(invalidSeance);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Calories are required');
        });

        it('should return 401 if user is Unauthorized', async () => {
            const invalidSeance = {
                type: 1,
                duration: 60,
                distance: 10,
                calories: 500
            };

            const response = await request(app).post('/seances').set("Authorization", `Bearer `).send(invalidSeance);

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /:seanceId', () => {
        afterEach(async () => {
            await Seance.deleteMany();
            await User.deleteMany();
        });
        let token;
        beforeEach(async () => {
            const user = new User({ email: 'seance@example.com', username: 'seanceuser', password: 'password123' });
            await user.save();

            token = jwt.sign({ id: user._id, email: user.email, username: user.username }, process.env.JWT_SECRET, { expiresIn: '3h' });

            const seance = new Seance({
                type: 1,
                duration: 60,
                distance: 10,
                calories: 500,
                user: user._id
            });
            await seance.save();
        });
        it ('should update an existing seance successfully', async () => {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const seance = await Seance.findOne({ user: decodedToken.id });
            const updatedSeance = {
                type: 2,
                duration: 90,
                distance: 20,
                calories: 700
            };

            const response = await request(app).put(`/seances/${seance._id}`).set("Authorization", `Bearer ${token}`).send(updatedSeance);

            expect(response.status).toBe(200);
            expect(response.body.type).toBe(updatedSeance.type);
            expect(response.body.duration).toBe(updatedSeance.duration);
            expect(response.body.distance).toBe(updatedSeance.distance);
            expect(response.body.calories).toBe(updatedSeance.calories);
        });
        it ('should return 403 if seance does not belong to user', async () => {
            const wrongUser = new User({ email: 'wronguser@example.com', username: 'seancessuser', password: 'wrongUser123' });
            await wrongUser.save();
            tokenWrongUser = jwt.sign({ id: wrongUser._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const seance = await Seance.findOne({ user: decodedToken.id });
            const updatedSeance = {
                type: 2,
                duration: 90,
                distance: 20,
                calories: 700
            };
            const response = await request(app).put(`/seances/${seance._id}`).set("Authorization", `Bearer ${tokenWrongUser}`).send(updatedSeance);
            expect(response.status).toBe(403);
        });
        it ('should return 400 if seanceId is invalid', async () => {
            const updatedSeance = {
                type: 2,
                duration: 90,
                distance: 20,
                calories: 700
            };
            const response = await request(app).put(`/seances/invalidId`).set("Authorization", `Bearer ${token}`).send(updatedSeance);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid seance ID');
        });
        it ('should return 404 if seance does not exist', async () => {
            const updatedSeance = {
                type: 2,
                duration: 90,
                distance: 20,
                calories: 700
            };
            const response = await request(app).put(`/seances/60d5f484f9d1c8b8a4b8e4f1`).set("Authorization", `Bearer ${token}`).send(updatedSeance);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Seance not found');
        });
        it ('should return 400 if type is invalid', async () => {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const seance = await Seance.findOne({ user: decodedToken.id });
            const updatedSeance = {
                type: 4,
                duration: 90,
                distance: 20,
                calories: 700
            };
            const response = await request(app).put(`/seances/${seance._id}`).set("Authorization", `Bearer ${token}`).send(updatedSeance);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Type must be 1 (Course), 2 (Vélo), or 3 (Musculation)');
        });
        it ('should return 400 if duration is invalid', async () => {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const seance = await Seance.findOne({ user: decodedToken.id });
            const updatedSeance = {
                type: 1,
                duration: -10,
                distance: 20,
                calories: 700
            };
            const response = await request(app).put(`/seances/${seance._id}`).set("Authorization", `Bearer ${token}`).send(updatedSeance);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Duration must be greater than 0');
        });
        it ('should return 400 if distance is invalid', async () => {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const seance = await Seance.findOne({ user: decodedToken.id });
            const updatedSeance = {
                type: 1,
                duration: 90,
                distance: -10,
                calories: 700
            };
            const response = await request(app).put(`/seances/${seance._id}`).set("Authorization", `Bearer ${token}`).send(updatedSeance);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Distance must be greater than or equal to 0');
        });
        it ('should return 400 if calories are invalid', async () => {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const seance = await Seance.findOne({ user: decodedToken.id });
            const updatedSeance = {
                type: 1,
                duration: 90,
                distance: 20,
                calories: -10
            };
            const response = await request(app).put(`/seances/${seance._id}`).set("Authorization", `Bearer ${token}`).send(updatedSeance);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Calories must be greater than or equal to 0');
        });
        it ('should return 401 if user is Unauthorized', async () => {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const seance = await Seance.findOne({ user: decodedToken.id });
            const updatedSeance = {
                type: 1,
                duration: 90,
                distance: 20,
                calories: 700
            };
            const response = await request(app).put(`/seances/${seance._id}`).set("Authorization", `Bearer `).send(updatedSeance);
            expect(response.status).toBe(401);
        });
        it ('should return 400 if seanceId is not provided', async () => {
            const updatedSeance = {
                type: 1,
                duration: 90,
                distance: 20,
                calories: 700
            };
            const response = await request(app).put(`/seances/`).set("Authorization", `Bearer ${token}`).send(updatedSeance);
            expect(response.status).toBe(404);
        });
    });
    describe('DELETE /:seanceId', () => {
        afterEach(async () => {
            await Seance.deleteMany();
            await User.deleteMany();
        });

        let token;
        let user;
        let seance;

        beforeEach(async () => {
            user = new User ({ email: 'deletetest@example.com', username: 'seancessuser', password: 'password123' });
            await user.save();
            token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
            seance = new Seance({
                type: 1,
                duration: 60,
                distance: 10,
                calories: 500,
                user: user._id
            });
            await seance.save();
        });
        it ('should delete an existing seance successfully', async () => {
            const response = await request(app).delete(`/seances/${seance._id}`).set("Authorization", `Bearer ${token}`).send();
            expect(response.status).toBe(204);
            expect(response.body).toEqual({});

            const deletedSeance = await Seance.findById(seance._id);
            expect(deletedSeance).toBeNull();
        });
        it ('should return 403 if seance does not belong to user', async () => {
            wrongUser = new User ({ email: 'deletewronguser@example.com', username: 'seancessuser', password: 'password123' });
            await wrongUser.save();
            tokenWrongUser = jwt.sign({ id: wrongUser._id }, process.env.JWT_SECRET, { expiresIn: '3h' });

            const response = await request(app).delete(`/seances/${seance._id}`).set("Authorization", `Bearer ${tokenWrongUser}`).send();
            expect(response.status).toBe(403);
            expect(response.body.error).toBe('You are not authorized to delete this seance');

            const foundSeance = await Seance.findById(seance._id);
            expect(foundSeance).not.toBeNull();
        });
        it ('should return 400 if seanceId is invalid', async () => {
            const response = await request(app).delete(`/seances/invalidId`).set("Authorization", `Bearer ${token}`).send();
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid seance ID');
        });
        it ('should return 404 if seance does not exist', async () => {
            const response = await request(app).delete(`/seances/60d5f484f9d1c8b8a4b8e4f1`).set("Authorization", `Bearer ${token}`).send();
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Seance not found');
        });
        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .delete(`/seances/${seance._id}`);
                
            expect(response.status).toBe(401);
        });
        it('should return 401 if token is invalid', async () => {
            const response = await request(app)
                .delete(`/seances/${seance._id}`)
                .set("Authorization", "Bearer invalidtoken");
                
            expect(response.status).toBe(401);
        });
    });
    describe('GET /', () => {
        afterEach(async () => {
            await Seance.deleteMany();
            await User.deleteMany();
        });
        
        let token;
        let user;
        
        beforeEach(async () => {
            // Create a user
            user = new User({ email: 'gettest@example.com', username: 'seancessuser', password: 'password123' });
            await user.save();
            
            // Create token for this user
            token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
            
            // Create multiple seances for this user
            const seances = [
                {
                    type: 1,
                    duration: 60,
                    distance: 10,
                    calories: 500,
                    user: user._id
                },
                {
                    type: 2,
                    duration: 45,
                    distance: 15,
                    calories: 300,
                    user: user._id
                },
                {
                    type: 3,
                    duration: 30,
                    distance: 0,
                    calories: 200,
                    user: user._id
                }
            ];
            
            await Seance.insertMany(seances);
        });
        
        it('should return all seances for the authenticated user', async () => {
            const response = await request(app)
                .get('/seances')
                .set("Authorization", `Bearer ${token}`);
                
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            
            // Check that all seances belong to this user
            response.body.forEach(seance => {
                expect(seance.user).toBe(user._id.toString());
            });
        });
        
        it('should return empty array if user has no seances', async () => {
            // Create a user with no seances
            const emptyUser = new User({ email: 'empty@example.com', username: 'seancessuser', password: 'password123' });
            await emptyUser.save();
            
            // Create token for this user
            const emptyToken = jwt.sign({ id: emptyUser._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
            
            const response = await request(app)
                .get('/seances')
                .set("Authorization", `Bearer ${emptyToken}`);
                
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });
        
        it('should not return seances from other users', async () => {
            // Create another user with their own seance
            const otherUser = new User({ email: 'other@example.com', username: 'seancessuser', password: 'password123' });
            await otherUser.save();
            
            const otherSeance = new Seance({
                type: 1,
                duration: 120,
                distance: 25,
                calories: 800,
                user: otherUser._id
            });
            await otherSeance.save();
            
            // Get seances for original user
            const response = await request(app)
                .get('/seances')
                .set("Authorization", `Bearer ${token}`);
                
            expect(response.status).toBe(200);
            
            // Check that no seances from other user are returned
            const hasOtherUserSeances = response.body.some(seance => 
                seance.user === otherUser._id.toString());
            expect(hasOtherUserSeances).toBe(false);
        });
        
        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .get('/seances');
                
            expect(response.status).toBe(401);
        });
        
        it('should return 401 if token is invalid', async () => {
            const response = await request(app)
                .get('/seances')
                .set("Authorization", "Bearer invalidtoken");
                
            expect(response.status).toBe(401);
        });
        
        it('should return 404 if user does not exist', async () => {
            // Create token with non-existent user ID
            const nonExistentId = new mongoose.Types.ObjectId();
            const invalidUserToken = jwt.sign({ id: nonExistentId }, process.env.JWT_SECRET, { expiresIn: '3h' });
            
            const response = await request(app)
                .get('/seances')
                .set("Authorization", `Bearer ${invalidUserToken}`);
                
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });
});
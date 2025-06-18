const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Seance = require('../models/Seance');
const jwt = require('jsonwebtoken');

describe('Goal Routes', () => {
    let user;
    let token;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days in the future
    
    beforeEach(async () => {
        await User.deleteMany();
        await Goal.deleteMany();
        await Seance.deleteMany();
        
        // Create test user for all tests
        user = new User({ email: 'goaltest@example.com', username: 'goaltestuser', password: 'password123' });
        await user.save();
        token = jwt.sign({ id: user._id, email: user.email, username: user.username }, process.env.JWT_SECRET, { expiresIn: '3h' });
    });
    
    afterAll(async () => {
        await mongoose.connection.close();
    });
    
    describe('POST / - Create a new goal', () => {
        it('should create a new goal successfully', async () => {
            const startDate = new Date();
            const endDate = new Date(futureDate);
            
            const response = await request(app)
                .post('/goals')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    seance_type: 1, // Running
                    goal_type: 1,   // Distance
                    goal_value: 100000, // 100km
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                });
            
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Goal created successfully');
            expect(response.body.goal).toHaveProperty('_id');
            expect(response.body.goal.seance_type).toBe(1);
            expect(response.body.goal.goal_type).toBe(1);
            expect(response.body.goal.goal_value).toBe(100000);
            expect(response.body.goal.is_active).toBe(true);
        });
        
        it('should return 400 when required fields are missing', async () => {
            const response = await request(app)
                .post('/goals')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    seance_type: 1
                    // Missing other required fields
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
        
        it('should return 400 when seance_type is invalid', async () => {
            const startDate = new Date();
            const endDate = new Date(futureDate);
            
            const response = await request(app)
                .post('/goals')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    seance_type: 5, // Invalid (should be 1, 2, or 3)
                    goal_type: 1,
                    goal_value: 100000,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Session type must be 1 (Course), 2 (Vélo), or 3 (Musculation)');
        });
        
        it('should return 400 when goal_type is invalid', async () => {
            const startDate = new Date();
            const endDate = new Date(futureDate);
            
            const response = await request(app)
                .post('/goals')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    seance_type: 1,
                    goal_type: 5, // Invalid (should be 1, 2, or 3)
                    goal_value: 100000,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Goal type must be 1 (Distance), 2 (Duration), or 3 (Calories)');
        });
        
        it('should return 400 when goal_value is not positive', async () => {
            const startDate = new Date();
            const endDate = new Date(futureDate);
            
            const response = await request(app)
                .post('/goals')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    seance_type: 1,
                    goal_type: 1,
                    goal_value: -100, // Negative value
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Goal value must be a positive number');
        });
        
        it('should return 400 when dates are invalid', async () => {
            const response = await request(app)
                .post('/goals')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    seance_type: 1,
                    goal_type: 1,
                    goal_value: 100000,
                    start_date: 'invalid-date',
                    end_date: futureDate.toISOString()
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid start date format');
        });
        
        it('should return 400 when end date is before start date', async () => {
            const startDate = new Date(futureDate);
            const endDate = new Date(); // End date earlier than start date
            
            const response = await request(app)
                .post('/goals')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    seance_type: 1,
                    goal_type: 1,
                    goal_value: 100000,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('End date must be after start date');
        });
        
        it('should return 400 when end date is in the past', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 9); // 9 days ago
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 10); // 10 days ago
            
            const response = await request(app)
                .post('/goals')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    seance_type: 1,
                    goal_type: 1,
                    goal_value: 100000,
                    start_date: startDate.toISOString(),
                    end_date: pastDate.toISOString()
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('End date cannot be in the past');
        });
        
        it('should return 400 when user already has an active goal', async () => {
            // Create an initial active goal
            const startDate = new Date();
            const endDate = new Date(futureDate);
            
            const goal = new Goal({
                seance_type: 1,
                goal_type: 1,
                goal_value: 10000,
                start_date: startDate,
                end_date: endDate,
                is_active: true,
                user: user._id
            });
            await goal.save();
            
            // Try to create another goal
            const response = await request(app)
                .post('/goals')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    seance_type: 2,
                    goal_type: 2,
                    goal_value: 500,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('You already have an active goal. Delete your current goal before creating a new one.');
        });
        
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .post('/goals')
                .send({
                    seance_type: 1,
                    goal_type: 1,
                    goal_value: 100000,
                    start_date: new Date().toISOString(),
                    end_date: futureDate.toISOString()
                });
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });
    });
    
    describe('GET /active - Get active goal', () => {
        it('should return the active goal for the user', async () => {
            // Create an active goal
            const goal = new Goal({
                seance_type: 2,
                goal_type: 2,
                goal_value: 500,
                start_date: new Date(),
                end_date: futureDate,
                is_active: true,
                user: user._id
            });
            await goal.save();
            
            const response = await request(app)
                .get('/goals/active')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('goal');
            expect(response.body.goal._id).toBe(goal._id.toString());
            expect(response.body.goal.seance_type).toBe(2);
            expect(response.body.goal.goal_value).toBe(500);
        });
        
        it('should return 404 when no active goal exists', async () => {
            const response = await request(app)
                .get('/goals/active')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No active goal found');
        });
        
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .get('/goals/active');
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });
    });
    
    describe('GET /history - Get goal history', () => {
        it('should return the goal history for the user', async () => {
            // Create some completed goals
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 30);
            
            const goal1 = new Goal({
                seance_type: 1,
                goal_type: 1,
                goal_value: 10000,
                start_date: pastDate,
                end_date: new Date(),
                is_active: false,
                is_achieved: true,
                user: user._id
            });
            
            const goal2 = new Goal({
                seance_type: 2,
                goal_type: 2,
                goal_value: 500,
                start_date: pastDate,
                end_date: new Date(),
                is_active: false,
                is_achieved: false,
                user: user._id
            });
            
            await goal1.save();
            await goal2.save();
            
            const response = await request(app)
                .get('/goals/history')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('goals');
            expect(Array.isArray(response.body.goals)).toBe(true);
            expect(response.body.goals.length).toBe(2);
            expect(response.body.goals[0].is_active).toBe(false);
            expect(response.body.goals[1].is_active).toBe(false);
        });
        
        it('should return empty array when no goal history exists', async () => {
            const response = await request(app)
                .get('/goals/history')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('goals');
            expect(Array.isArray(response.body.goals)).toBe(true);
            expect(response.body.goals.length).toBe(0);
        });
        
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .get('/goals/history');
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });
    });
    
    describe('DELETE /active - Delete active goal', () => {
        it('should delete the active goal', async () => {
            // Create an active goal
            const goal = new Goal({
                seance_type: 1,
                goal_type: 1,
                goal_value: 10000,
                start_date: new Date(),
                end_date: futureDate,
                is_active: true,
                user: user._id
            });
            await goal.save();
            
            const response = await request(app)
                .delete('/goals/active')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Goal deleted successfully');
            
            // Verify goal is deleted from database
            const deletedGoal = await Goal.findById(goal._id);
            expect(deletedGoal).toBeNull();
        });
        
        it('should return 404 when no active goal exists', async () => {
            const response = await request(app)
                .delete('/goals/active')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('No active goal found');
        });
        
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .delete('/goals/active');
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });
    });
    
    describe('GET /check-progress - Check goal progress', () => {
        it('should return goal progress for an active goal', async () => {
            // Create an active goal
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 10); // 10 days ago
            
            const goal = new Goal({
                seance_type: 1, // Running
                goal_type: 1, // Distance (meters)
                goal_value: 10000, // 10km
                start_date: startDate,
                end_date: futureDate,
                is_active: true,
                user: user._id
            });
            await goal.save();
            
            // Create some workout sessions related to the goal
            const seances = [
                new Seance({
                    type: 1,
                    duration: 30,
                    distance: 3000,
                    calories: 300,
                    date: new Date(startDate.getTime() + 2*24*60*60*1000), // 2 days after start
                    user: user._id
                }),
                new Seance({
                    type: 1,
                    duration: 45,
                    distance: 5000,
                    calories: 450,
                    date: new Date(startDate.getTime() + 5*24*60*60*1000), // 5 days after start
                    user: user._id
                })
            ];
            await Seance.insertMany(seances);
            
            const response = await request(app)
                .get('/goals/check-progress')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('goal');
            expect(response.body).toHaveProperty('progress');
            expect(response.body.progress.current).toBe(8000); // 3000 + 5000
            expect(response.body.progress.target).toBe(10000);
            expect(response.body.progress.percentage).toBe(80); // 8000/10000 * 100
        });
        
        it('should close expired goals and mark as achieved if completed', async () => {
            // Create a goal that's expired (end date in the past)
            const pastStartDate = new Date();
            pastStartDate.setDate(pastStartDate.getDate() - 20); // 20 days ago
            
            const pastEndDate = new Date();
            pastEndDate.setDate(pastEndDate.getDate() - 1); // Yesterday
            
            const goal = new Goal({
                seance_type: 2, // Cycling
                goal_type: 3, // Calories
                goal_value: 1000,
                start_date: pastStartDate,
                end_date: pastEndDate,
                is_active: true,
                user: user._id
            });
            await goal.save();
            
            // Create seances that exceed the goal
            const seances = [
                new Seance({
                    type: 2,
                    duration: 60,
                    distance: 15000,
                    calories: 600,
                    date: new Date(pastStartDate.getTime() + 2*24*60*60*1000),
                    user: user._id
                }),
                new Seance({
                    type: 2,
                    duration: 90,
                    distance: 22000,
                    calories: 800,
                    date: new Date(pastStartDate.getTime() + 5*24*60*60*1000),
                    user: user._id
                })
            ];
            await Seance.insertMany(seances);
            
            const response = await request(app)
                .get('/goals/check-progress')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Goal period has ended');
            expect(response.body).toHaveProperty('isAchieved', true);
            expect(response.body).toHaveProperty('actual', 1400); // 600 + 800
            expect(response.body).toHaveProperty('target', 1000);
            
            // Verify goal status updated in database
            const updatedGoal = await Goal.findById(goal._id);
            expect(updatedGoal.is_active).toBe(false);
            expect(updatedGoal.is_achieved).toBe(true);
        });
        
        it('should close expired goals and mark as not achieved if incomplete', async () => {
            // Create a goal that's expired with unachieved target
            const pastStartDate = new Date();
            pastStartDate.setDate(pastStartDate.getDate() - 20);
            
            const pastEndDate = new Date();
            pastEndDate.setDate(pastEndDate.getDate() - 1);
            
            const goal = new Goal({
                seance_type: 3, // Weight training
                goal_type: 2, // Duration (minutes)
                goal_value: 500, // 500 minutes of training
                start_date: pastStartDate,
                end_date: pastEndDate,
                is_active: true,
                user: user._id
            });
            await goal.save();
            
            // Create seances below the goal
            const seances = [
                new Seance({
                    type: 3,
                    duration: 45,
                    distance: 0,
                    calories: 200,
                    date: new Date(pastStartDate.getTime() + 3*24*60*60*1000),
                    user: user._id
                }),
                new Seance({
                    type: 3,
                    duration: 60,
                    distance: 0,
                    calories: 250,
                    date: new Date(pastStartDate.getTime() + 10*24*60*60*1000),
                    user: user._id
                })
            ];
            await Seance.insertMany(seances);
            
            const response = await request(app)
                .get('/goals/check-progress')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Goal period has ended');
            expect(response.body).toHaveProperty('isAchieved', false);
            expect(response.body).toHaveProperty('actual', 105); // 45 + 60
            expect(response.body).toHaveProperty('target', 500);
            
            // Verify goal status updated in database
            const updatedGoal = await Goal.findById(goal._id);
            expect(updatedGoal.is_active).toBe(false);
            expect(updatedGoal.is_achieved).toBe(false);
        });
        
        it('should return 200 with message when no active goal exists', async () => {
            const response = await request(app)
                .get('/goals/check-progress')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'No active goal to check');
        });
        
        it('should return 401 when no token is provided', async () => {
            const response = await request(app)
                .get('/goals/check-progress');
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });
    });
});
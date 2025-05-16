# Sporty API

A fitness tracking REST API that allows users to log workouts, track progress, set goals, and view statistics.

## Getting Started

### Prerequisites
- Node.js
- MongoDB
- npm

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file with:
```
DB_USERNAME=yourusername
DB_PASSWORD=yourpassword
DB_CLUSTER=yourcluster
DB_NAME=yourdbname
JWT_SECRET=yoursecretkey
PORT=3001
```
4. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication Routes

#### Register User
- **URL**: `/users/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Registration successful",
    "token": "jwt_token",
    "user": { "email": "user@example.com", ... }
  }
  ```
- **Error Responses**:
  ```json
  {
    "error": "Email is required"
  }
  ```
  or
  ```json
  {
    "error": "Password is required"
  }
  ```
  or
  ```json
  {
    "error": "Email already exists"
  }
  ```
- **Description**: Registers a new user and returns JWT token for immediate authentication

#### Login
- **URL**: `/users/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Login successful",
    "token": "jwt_token",
    "user": { "email": "user@example.com", ... }
  }
  ```
- **Description**: Authenticates a user and returns JWT token

#### Verify Token
- **URL**: `/users/verify-token`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "token": "jwt_token"
  }
  ```
- **Response**: 
  ```json
  {
    "valid": true,
    "user": { "id": "user_id", ... }
  }
  ```
  or
  ```json
  {
    "valid": false,
    "error": "Token expired"
  }
  ```
- **Description**: Verifies if a JWT token is valid and returns the decoded user information

### Workout Session Routes (Séances)

All séance routes require authentication via Bearer token.

#### Create Session
- **URL**: `/seances`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "type": 1, // 1: Running, 2: Cycling, 3: Weight Training
    "duration": 60, // in minutes
    "distance": 5000, // in meters
    "calories": 300
  }
  ```
- **Response**: Created séance object
- **Description**: Records a new workout session

#### Get All Sessions
- **URL**: `/seances`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Array of séance objects for the authenticated user
- **Description**: Returns all workout sessions for the current user

#### Update Session
- **URL**: `/seances/:seanceId`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: Same as create session
- **Response**: Updated séance object
- **Description**: Updates an existing workout session

#### Delete Session
- **URL**: `/seances/:seanceId`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: 204 No Content
- **Description**: Deletes a specific workout session

### Statistics Routes

All statistics routes require authentication via Bearer token.

#### Weekly Statistics
- **URL**: `/statistics/weekly`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**: `date` (optional, format: YYYY-MM-DD)
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Weekly statistics retrieved successfully",
    "data": {
      "totalSessions": 5,
      "totalDuration": 300,
      "totalDistance": 25000,
      "totalCalories": 1500,
      "averageDuration": 60,
      "averageDistance": 5000,
      "averageCalories": 300
    }
  }
  ```
- **Description**: Returns workout statistics for the current week or specified week

#### Monthly Statistics
- **URL**: `/statistics/monthly`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**: `date` (optional, format: YYYY-MM-DD)
- **Response**: Similar to weekly statistics but for the month
- **Description**: Returns workout statistics for the current month or specified month

#### Compare Sessions
- **URL**: `/statistics/compare`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**: 
  - `seance1`: ID of first session
  - `seance2`: ID of second session
- **Response**: Comparison data between the two sessions
- **Description**: Compares two workout sessions and shows differences

#### Calories by Activity Type
- **URL**: `/statistics/calories-by-activity`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Calories burned statistics grouped by activity type
- **Description**: Returns calories information by workout type

### Goals Routes

All goals routes require authentication via Bearer token.

#### Create Goal
- **URL**: `/goals`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "seance_type": 1, // 1: Running, 2: Cycling, 3: Weight Training
    "goal_type": 1, // 1: Distance, 2: Duration, 3: Calories
    "goal_value": 20000, // Target value
    "start_date": "2025-04-10", // Start date
    "end_date": "2025-04-20" // End date
  }
  ```
- **Response**: Created goal object
- **Description**: Creates a new workout goal. Only one active goal is allowed at a time.

#### Get Active Goal
- **URL**: `/goals/active`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Currently active goal
- **Description**: Returns the user's current active goal

#### Get Goal History
- **URL**: `/goals/history`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Array of past goals
- **Description**: Returns the user's past (completed or expired) goals

#### Delete Active Goal
- **URL**: `/goals/active`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Success message
- **Description**: Deletes the user's current active goal

#### Check Goal Progress
- **URL**: `/goals/check-progress`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Progress details for the current goal
- **Description**: Returns progress information for the active goal and automatically updates status for expired goals

### Run Tests
1. Create a `.test.env` file with:
```
DB_USERNAME=yourusername
DB_PASSWORD=yourpassword
DB_CLUSTER=yourcluster
DB_NAME=yourtestdbname
JWT_SECRET=yoursecretkey
PORT=3002
```

2. Run tests
```bash
npm run test
```
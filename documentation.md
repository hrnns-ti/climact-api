# API Documentation - ClimACT

## Overview

RESTful API for a daily and weekly quest system with JWT authentication. This system supports gamification with progress tracking, period validation, automatic points system, and data ownership security.

## Base URL

```
http://localhost:5500
```

## Authentication

All endpoints (except register & login) require JWT token in the header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Authentication

#### Register

Register a new user account. New users automatically receive `points: 0`.

**Endpoint:** `POST /auth/register`

**Request Body:**

```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**

- **201 Created** - User successfully registered

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **400 Bad Request** - Invalid data or username already exists

---

#### Login

Perform login and retrieve JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**

```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**

- **200 OK**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **401 Unauthorized** - Invalid username or password

---

### 2. User Profile & Points

#### Get User Profile

Retrieve current logged-in user profile, including total points and quest statistics.

**Endpoint:** `GET /users/me`

**Headers:** Requires JWT Token

**Response:**

- **200 OK**

```json
{
  "user": {
    "id": 1,
    "username": "haerunnas@climact.ti",
    "email": null,
    "points": 175
  },
  "stats": {
    "total_quests": 7,
    "completed_quests": 3,
    "total_progress": 9
  }
}
```

**Field Explanation:**

- `user.points` - Total points accumulated by the user
- `stats.total_quests` - Total number of quests started by user
- `stats.completed_quests` - Number of quests successfully completed (completed = 1)
- `stats.total_progress` - Sum of progress from all completed quests

**Response Codes:**

- **401 Unauthorized** - Invalid token
- **404 Not Found** - User not found

---

### 3. Quest Master (Admin)

#### Get All Quests

Retrieve all available quests.

**Endpoint:** `GET /quests`

**Response:**

```json
[
  {
    "id": 1,
    "name": "Recycle 5 Bottles",
    "description": "Recycle 5 plastic bottles",
    "points": 50,
    "category": "daily",
    "target": 5,
    "deadline": "2025-10-30T23:59:59.000Z",
    "created": "2025-10-28T10:00:00.000Z"
  }
]
```

---

#### Create Quest

Create a new quest (admin).

**Endpoint:** `POST /quests`

**Request Body:**

```json
{
  "name": "Plant Trees",
  "description": "Plant 3 trees this week",
  "points": 100,
  "category": "weekly",
  "target": 3,
  "deadline": "2025-10-31T23:59:59"
}
```

**Field Explanation:**

- `name` (required): Quest name
- `description` (required): Quest description
- `points` (required): Points awarded upon completion
- `category` (required): `"daily"` or `"weekly"`
- `target` (required): Progress needed to complete
- `deadline` (optional): Quest deadline (ISO 8601 format)

**Response:**

- **201 Created** - Quest successfully created
- **400 Bad Request** - Invalid data

---

#### Update Quest

Modify quest data.

**Endpoint:** `PATCH /quests/:id`

**Request Body:**

```json
{
  "target": 10
}
```

**Response:**

- **200 OK** - Quest successfully updated
- **404 Not Found** - Quest not found

---

#### Delete Quest

Delete a quest.

**Endpoint:** `DELETE /quests/:id`

**Response:**

- **200 OK** - Quest successfully deleted
- **404 Not Found** - Quest not found

---

### 4. User Quest (Quest Instance per User)

#### Start Quest

Begin a quest for the user. Users can freely choose any periode when starting (periode validation only applies to progress/complete).

**Endpoint:** `POST /userquest/start`

**Request Body:**

```json
{
  "quest_id": 3,
  "periode": "2025-10-28"
}
```

**Periode Format:**

- **Daily:** `YYYY-MM-DD` (example: `"2025-10-28"`)
- **Weekly:** `YYYY-Wxx` (example: `"2025-W44"`)

**Response:**

- **201 Created**

```json
{
  "id": 7,
  "user_id": 5,
  "quest_id": 3,
  "periode": "2025-10-28",
  "progress": 0,
  "completed": 0,
  "started": "2025-10-28T12:00:00.000Z"
}
```

**Error Response:**

- **400 Bad Request** - Invalid data
- **404 Not Found** - Quest not found
- **409 Conflict** - Quest already started in this periode

---

#### Get User Quests

Retrieve all quests for the logged-in user.

**Endpoint:** `GET /userquest`

**Query Parameters (optional):**

- `periode` - Filter by periode (example: `?periode=2025-10-28`)

**Response:**

```json
[
  {
    "id": 7,
    "user_id": 5,
    "quest_id": 3,
    "periode": "2025-10-28",
    "progress": 2,
    "completed": 0,
    "started": "2025-10-28T12:00:00.000Z",
    "finished": null
  },
  {
    "id": 8,
    "user_id": 5,
    "quest_id": 4,
    "periode": "2025-10-28",
    "progress": 4,
    "completed": 1,
    "started": "2025-10-28T12:10:00.000Z",
    "finished": "2025-10-28T12:30:00.000Z"
  }
]
```

**Field Explanation:**

- `completed`: `1` if quest is finished, `0` if in progress
- `finished`: Quest completion timestamp (ISO 8601) or `null` if not completed

---

#### Update Quest Progress

Add progress to a quest. **Progress increments every time this endpoint is called, but user points ONLY increase when quest is completed (progress = target).**

**Endpoint:** `PATCH /userquest/:id/progress`

**Request Body:**

```json
{
  "increment": 1
}
```

**Field Explanation:**

- `increment` (optional): Amount of progress to add (default: 1)

**Response (Progress Updated, Not Yet Complete):**

- **200 OK**

```json
{
  "message": "Progress updated",
  "progress": 2,
  "target": 5,
  "completed": false,
  "points_earned": 0,
  "finished": null
}
```

**Response (Quest Completed, Points Awarded):**

- **200 OK**

```json
{
  "message": "Quest completed! Points awarded!",
  "progress": 5,
  "target": 5,
  "completed": true,
  "points_earned": 100,
  "finished": "2025-10-28T12:35:00.000Z"
}
```

**Error Response:**

- **400 Bad Request** - Quest already completed, invalid periode, or invalid increment
- **403 Forbidden** - Not the owner of this quest
- **404 Not Found** - Quest not found

---

#### Complete Quest Manually

Mark a quest as completed manually. Points will be automatically added.

**Endpoint:** `PATCH /userquest/:id/complete`

**Response:**

- **200 OK**

```json
{
  "message": "Quest marked as completed! Points awarded!",
  "points_earned": 100
}
```

**Error Response:**

- **400 Bad Request** - Invalid periode or deadline exceeded
- **403 Forbidden** - Not the owner of this quest
- **404 Not Found** - Quest not found

---

## Points & Reward System

### How Points Work

1. **Points Start at 0** - New users automatically receive `points: 0`
2. **Progress Tracking** - Each `PATCH /userquest/:id/progress` increments progress (points unchanged yet)
3. **Auto Reward** - When progress reaches target (quest complete), user automatically receives points
4. **Points Increment** - Query `UPDATE users SET points = points + ?` ensures points are **ADDED**, not replaced

### Example Scenario

```
User: alice
Initial Points: 0

Quest A: target=4, points=75
- Step 1: PATCH /progress → progress: 1/4, points: 0 (unchanged)
- Step 2: PATCH /progress → progress: 2/4, points: 0 (unchanged)
- Step 3: PATCH /progress → progress: 3/4, points: 0 (unchanged)
- Step 4: PATCH /progress → progress: 4/4 ✅ COMPLETE!
  → alice.points: 0 + 75 = 75

Quest B: target=2, points=50
- Step 1: PATCH /progress → progress: 1/2, points: 75 (no change)
- Step 2: PATCH /progress → progress: 2/2 ✅ COMPLETE!
  → alice.points: 75 + 50 = 125

Final Profile:
- points: 125
- completed_quests: 2
- total_progress: 6 (4 + 2 from completed quests)
```

---

## Validation & Security

### Ownership Check

- All `/userquest/:id/...` endpoints can only be accessed by the owner
- Attempting to access another user's quest returns **403 Forbidden**

### Periode Validation

- Quests can only be progressed/completed in the correct periode:
  - **Daily:** Must be in the same calendar day as periode
  - **Weekly:** Must be in the same calendar week as periode
- Invalid periode returns **400 Bad Request**

### Other Validations

- Cannot start the same quest twice in the same periode (409 Conflict)
- Cannot progress a quest that is already completed (400 Bad Request)
- Progress automatically completes when reaching target
- Cannot progress/complete after deadline has passed

---

## Status Codes

| Code | Description                                              |
| ---- | -------------------------------------------------------- |
| 200  | OK - Request successful                                  |
| 201  | Created - Data successfully created                      |
| 400  | Bad Request - Invalid data or validation failed          |
| 401  | Unauthorized - Invalid/expired token                     |
| 403  | Forbidden - No access to resource                        |
| 404  | Not Found - Resource not found                           |
| 409  | Conflict - Resource already exists (e.g., quest started) |
| 500  | Internal Server Error - Server error                     |

---

## Error Response Format

All errors return JSON format:

```json
{
  "error": "Error description"
}
```

---

## Testing with Thunder Client / Postman

### Setup

1. Import collection or create new requests
2. Set base URL: `http://localhost:5500`
3. Register new user
4. Login and save token in Authorization header

### Test Flow

1. **Register new user**

```
POST /auth/register
{ "username": "alice", "password": "alice12345" }
```

2. **Login and check initial profile**

```
POST /auth/login
GET /users/me → points: 0, total_quests: 0
```

3. **Create quest and start**

```
POST /quests → create quest (points=75, target=4)
POST /userquest/start → start quest
```

4. **Add progress and observe stats changes**

```
PATCH /userquest/1/progress → progress: 1/4
PATCH /userquest/1/progress → progress: 2/4
PATCH /userquest/1/progress → progress: 3/4
PATCH /userquest/1/progress → progress: 4/4 ✅ COMPLETE!
GET /users/me → points: 75, completed_quests: 1
```

5. **Security test: try accessing another user's quest (expect 403)**

---

## Database Schema

### Table: users

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password TEXT,
  points INTEGER DEFAULT 0
);
```

### Table: quest

```sql
CREATE TABLE quest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('daily', 'weekly')),
  points INTEGER DEFAULT 0,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deadline TIMESTAMP NOT NULL,
  target INTEGER NOT NULL DEFAULT 1
);
```

### Table: user_quests

```sql
CREATE TABLE user_quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  quest_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT 0,
  started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished TIMESTAMP,
  periode TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(quest_id) REFERENCES quest(id),
  UNIQUE (user_id, quest_id, periode)
);
```

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "better-sqlite3": "^8.5.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "date-fns": "^2.30.0",
  "passport": "^0.6.0",
  "passport-google-oauth20": "^2.0.0",
  "express-session": "^1.17.3",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "express-validator": "^7.0.0"
}
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5500
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=1d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## Implementation Notes

1. JWT tokens are valid for 1 day (configurable in `.env`)
2. Passwords are hashed using bcrypt before storage
3. Daily periode uses `YYYY-MM-DD` format, weekly uses `YYYY-Wxx` format
4. Periode validation uses `date-fns` library for accuracy
5. All endpoints are protected with JWT middleware except register & login
6. Points system uses INCREMENT query to prevent race conditions
7. Stats are calculated via aggregate queries (COUNT, SUM) on profile retrieval

---

## Future Enhancements

- [ ] Leaderboard (`GET /users/leaderboard`)
- [ ] Badge and achievement system
- [ ] Quest statistics and detailed analytics
- [ ] Notification system
- [ ] Quest categories expansion
- [ ] Quest recommendation engine
- [ ] Social features (friends, groups, challenges)
- [ ] Carbon footprint calculator
- [ ] Quest difficulty levels
- [ ] Seasonal events

---

## License

[All Rights Reserved Copyright (c) 2025 hrnns-ti](./LICENSE)

---

## Support

For questions or bug reports, please create an issue in the GitHub repository.

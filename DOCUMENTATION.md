# 📚 ClimACT API – Complete API Reference

**Comprehensive REST API documentation for the ClimACT platform.**

---

## 📌 Table of Contents

1. [Base URL & Authentication](#base-url--authentication)
2. [Authentication Endpoints](#authentication-endpoints)
3. [User Profile & Statistics](#user-profile--statistics)
4. [Quest System](#quest-system)
5. [Quiz Module](#quiz-module)
6. [Articles Management](#articles-management)
7. [Public Endpoints](#public-endpoints)
8. [Error Handling](#error-handling)
9. [Testing Guide](#testing-guide)

---

## Base URL & Authentication

### Base URL
```
http://localhost:5500
```

### Authentication Header
All endpoints except register, login, forgot, and reset require JWT token:

```
Authorization: Bearer <JWT_TOKEN>
```

Obtain token from `/api/auth/login` endpoint.

---

## Authentication Endpoints

### 1. Register

Create a new user account. New users automatically receive `points: 0`.

**Endpoint:**
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "green_warrior",
  "email": "user@example.com",
  "password": "securepass123",
  "confirmPassword": "securepass123"
}
```

**Validation Rules:**
- Username: unique, minimum 3 characters
- Email: unique, valid format
- Password: minimum 8 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzY0NDI0NzM0fQ..."
}
```

**Error Response (400):**
```json
{
  "error": "Username already exists"
}
```

---

### 2. Login

Authenticate user and receive JWT token.

**Endpoint:**
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "identifier": "green_warrior",
  "password": "securepass123"
}
```

**Note:** `identifier` can be either username or email address.

**Success Response (201):**
```json
{
  "success": true,
  "user": {
    "id": 5,
    "username": "green_warrior",
    "points": 150
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid username or password"
}
```

---

### 3. Get User Profile

Retrieve authenticated user's profile information.

**Endpoint:**
```
GET /api/auth/profile
Authorization: Bearer <TOKEN>
```

**Success Response (200):**
```json
{
  "user": {
    "id": 5,
    "username": "green_warrior",
    "email": "user@example.com",
    "points": 150
  }
}
```

**Error Response (401):**
```json
{
  "error": "Unauthorized"
}
```

---

### 4. Forgot Password (OTP Request)

Request a 6-digit OTP for password reset. OTP is sent via email.

**Endpoint:**
```
POST /api/auth/forgot
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "If email exists, OTP has been sent"
}
```

**Security Note:** Response is identical whether email exists or not (prevents user enumeration).

**OTP Details:**
- Format: 6-digit numeric code
- Validity: 10 minutes
- Delivery: Email

---

### 5. Reset Password

Reset password using OTP received via email.

**Endpoint:**
```
POST /api/auth/reset/new
```

**Request Body:**
```json
{
  "token": "123456",
  "newPassword": "newsecurepass123"
}
```

**Validation Rules:**
- Token: 6-digit OTP, must be valid and not expired
- Password: minimum 8 characters

**Success Response (200):**
```json
{
  "message": "Password successfully updated. Please login with your new password.",
  "userId": 5
}
```

**Error Response (400):**
```json
{
  "error": "OTP expired or invalid"
}
```

---

## User Profile & Statistics

### 1. Get User Profile with Stats

Retrieve authenticated user's profile and statistics.

**Endpoint:**
```
GET /api/users/me
Authorization: Bearer <TOKEN>
```

**Success Response (200):**
```json
{
  "user": {
    "id": 5,
    "username": "green_warrior",
    "email": "user@example.com",
    "points": 150
  }
}
```

---

### 2. Get Counter Summary

Retrieve summary of all user activity counters.

**Endpoint:**
```
GET /api/users/summary
Authorization: Bearer <TOKEN>
```

**Success Response (200):**
```json
{
  "trashRecycled": 15,
  "tumblrReused": 8,
  "publicTransportUsed": 12
}
```

**Counter Definitions:**
- `trashRecycled` – Items recycled
- `tumblrReused` – Reusable items used instead of disposable
- `publicTransportUsed` – Times public transport was used

---

### 3. Increment Counter

Increase counter value by specified amount (auto-creates if not exists).

**Endpoint:**
```
POST /api/users/:counter/inc
Authorization: Bearer <TOKEN>
```

**URL Parameters:**
- `:counter` – Counter name: `trash_recycled`, `tumblr_reused`, or `public_transport_used`

**Request Body:**
```json
{
  "amount": 5
}
```

**Example Request:**
```
POST /api/users/trash_recycled/inc
{
  "amount": 5
}
```

**Success Response (200):**
```json
{
  "message": "Counter increased",
  "counter_name": "trash_recycled",
  "new_value": 20
}
```

---

### 4. Get User Badges

Retrieve all badges earned by the user.

**Endpoint:**
```
GET /api/users/me/badges
Authorization: Bearer <TOKEN>
```

**Success Response (200):**
```json
{
  "badges": [
    {
      "id": 1,
      "name": "First Quest Master",
      "description": "Complete your first quest",
      "awarded_at": "2025-11-29T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Quiz Champion",
      "description": "Score 80% or higher on 5 quizzes",
      "awarded_at": "2025-11-29T15:30:00Z"
    }
  ]
}
```

---

## Quest System

### 1. List All Quests

Retrieve all available quests (public endpoint).

**Endpoint:**
```
GET /api/quests
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Recycle 5 Plastic Bottles",
    "description": "Collect and recycle 5 plastic bottles",
    "category": "daily",
    "points": 50,
    "target": 5,
    "deadline": "2025-12-31T23:59:59Z"
  },
  {
    "id": 2,
    "name": "Plant 3 Trees",
    "description": "Plant 3 trees in your local area",
    "category": "weekly",
    "points": 100,
    "target": 3,
    "deadline": "2025-12-07T23:59:59Z"
  }
]
```

---

### 2. Start Quest

Begin a new quest for the authenticated user.

**Endpoint:**
```
POST /api/userquests/start
Authorization: Bearer <TOKEN>
```

**Request Body:**
```json
{
  "quest_id": 1,
  "periode": "2025-11-29"
}
```

**Periode Formats:**
- Daily: `YYYY-MM-DD` (example: `2025-11-29`)
- Weekly: `YYYY-Wxx` (example: `2025-W48`)

**Success Response (201):**
```json
{
  "id": 42,
  "user_id": 5,
  "quest_id": 1,
  "progress": 0,
  "completed": false,
  "periode": "2025-11-29",
  "started": "2025-11-29T10:00:00Z"
}
```

**Error Response (400):**
```json
{
  "error": "Quest not found or has expired"
}
```

---

### 3. Get User Quests

Retrieve all quests started by the user (in progress or completed).

**Endpoint:**
```
GET /api/userquests
Authorization: Bearer <TOKEN>
```

**Query Parameters (optional):**
- `periode` – Filter by periode (format: YYYY-MM-DD)

**Success Response (200):**
```json
[
  {
    "id": 42,
    "quest_id": 1,
    "progress": 3,
    "completed": false,
    "target": 5,
    "periode": "2025-11-29",
    "started": "2025-11-29T10:00:00Z",
    "finished": null
  },
  {
    "id": 41,
    "quest_id": 2,
    "progress": 3,
    "completed": true,
    "target": 3,
    "periode": "2025-W48",
    "started": "2025-11-22T10:00:00Z",
    "finished": "2025-11-29T15:30:00Z"
  }
]
```

---

### 4. Update Quest Progress

Increment quest progress. **Automatically awards points** when progress reaches target.

**Endpoint:**
```
PATCH /api/userquests/:id/progress
Authorization: Bearer <TOKEN>
```

**Request Body:**
```json
{
  "increment": 1
}
```

**Case 1: Progress Not Yet at Target**

**Response (200):**
```json
{
  "message": "Progress updated",
  "progress": 3,
  "target": 5,
  "completed": false,
  "points_earned": 0,
  "finished": null
}
```

**Case 2: Progress Reaches Target → Quest Complete!**

**Response (200):**
```json
{
  "message": "Quest completed! Points awarded!",
  "progress": 5,
  "target": 5,
  "completed": true,
  "points_earned": 50,
  "finished": "2025-11-29T15:30:00Z"
}
```

**At this moment, user points automatically increase by 50.**

---

## Quiz Module

### 1. Get Daily Quiz

Retrieve 5 random quiz questions for the day.

**Endpoint:**
```
GET /api/quizzes/daily
Authorization: Bearer <TOKEN>
```

**Success Response (200):**
```json
{
  "quiz": [
    {
      "id": 1,
      "question_text": "What is the primary greenhouse gas?",
      "choices": [
        { "choice_id": 1, "choice_text": "Carbon Dioxide (CO2)" },
        { "choice_id": 2, "choice_text": "Nitrogen (N2)" },
        { "choice_id": 3, "choice_text": "Oxygen (O2)" }
      ]
    },
    {
      "id": 2,
      "question_text": "What percentage of plastic waste is recyclable?",
      "choices": [
        { "choice_id": 4, "choice_text": "50%" },
        { "choice_id": 5, "choice_text": "100%" },
        { "choice_id": 6, "choice_text": "10%" }
      ]
    }
  ],
  "date": "2025-11-29",
  "questions_count": 5
}
```

---

### 2. Submit Quiz Answers

Submit quiz responses. **Automatically calculates score** and **awards points** (2 points per correct answer).

**Endpoint:**
```
POST /api/quizzes/daily/submit
Authorization: Bearer <TOKEN>
```

**Request Body:**
```json
{
  "answers": [
    { "question_id": 1, "selected_choice_id": 1 },
    { "question_id": 2, "selected_choice_id": 4 },
    { "question_id": 3, "selected_choice_id": 7 },
    { "question_id": 4, "selected_choice_id": 10 },
    { "question_id": 5, "selected_choice_id": 13 }
  ]
}
```

**Success Response (200):**
```json
{
  "score": 4,
  "total_questions": 5,
  "percentage": 80,
  "points_earned": 8,
  "message": "Quiz submitted successfully!"
}
```

**Important Notes:**
- User can submit **only once per day**
- Attempting to submit again returns `409 Conflict`
- Points are automatically added to user profile

---

## Articles Management

### 1. List Published Articles

Retrieve all published articles (public endpoint).

**Endpoint:**
```
GET /api/articles
Authorization: Bearer <TOKEN>
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "author_id": 5,
    "title": "How to Recycle Properly",
    "content": "Comprehensive guide on proper recycling techniques...",
    "status": "published",
    "created_at": "2025-11-28T10:00:00Z",
    "updated_at": "2025-11-29T08:30:00Z"
  }
]
```

---

### 2. Create Article

Create a new article (default status: `draft`).

**Endpoint:**
```
POST /api/articles
Authorization: Bearer <TOKEN>
```

**Request Body:**
```json
{
  "title": "5 Ways to Reduce Your Carbon Footprint",
  "content": "In this article, we explore 5 practical tips to reduce carbon emissions in daily life. From transportation choices to energy consumption..."
}
```

**Validation Rules:**
- `title` must be unique
- `content` minimum 10 characters

**Success Response (201):**
```json
{
  "message": "Article created",
  "id": 2
}
```

---

### 3. Update/Publish Article

Update article content or change publication status.

**Endpoint:**
```
PATCH /api/articles/:id
Authorization: Bearer <TOKEN>
```

**Request Body (Publish):**
```json
{
  "status": "published"
}
```

**Request Body (Update Content):**
```json
{
  "title": "Updated Title",
  "content": "Updated comprehensive content...",
  "status": "published"
}
```

**Success Response (200):**
```json
{
  "message": "Article updated successfully"
}
```

**Error Response (403):**
```json
{
  "error": "Only article author can update this article"
}
```

---

### 4. Delete Article

Permanently delete an article (author only).

**Endpoint:**
```
DELETE /api/articles/:id
Authorization: Bearer <TOKEN>
```

**Success Response (200):**
```json
{
  "message": "Article deleted permanently"
}
```

---

## Public Endpoints

### 1. Leaderboard

Retrieve top users ranked by total points.

**Endpoint:**
```
GET /api/public/leaderboard?limit=10&page=1
```

**Query Parameters:**
- `limit` – Number of users to return (default: 10)
- `page` – Page number (default: 1)

**Success Response (200):**
```json
[
  {
    "rank": 1,
    "username": "alice_green",
    "points": 500
  },
  {
    "rank": 2,
    "username": "bob_eco",
    "points": 450
  },
  {
    "rank": 3,
    "username": "carol_earth",
    "points": 425
  }
]
```

---

### 2. Get All Badges

Retrieve complete list of available badges.

**Endpoint:**
```
GET /api/public/badges
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "First Quest Completed",
    "description": "Complete your first climate action quest",
    "requirement": "complete_1_quest"
  },
  {
    "id": 2,
    "name": "Quiz Master",
    "description": "Score 80% or higher on 10 quizzes",
    "requirement": "quiz_score_80_x10"
  }
]
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example Scenario |
|------|---------|------------------|
| `200` | OK | Successful data retrieval or update |
| `201` | Created | Resource successfully created |
| `400` | Bad Request | Invalid input data, validation failed |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | User lacks permission (e.g., updating another user's article) |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource or duplicate action |
| `500` | Server Error | Internal server error |

### Error Response Format

```json
{
  "error": "Description of the error"
}
```

### Common Error Examples

**Invalid Token:**
```json
{
  "error": "Unauthorized"
}
```

**Validation Error:**
```json
{
  "error": "Password must be at least 8 characters"
}
```

**Not Found:**
```json
{
  "error": "Quest not found"
}
```

---

## Testing Guide

### Prerequisites

- VS Code with REST Client extension
- Valid JWT token from login

### Complete Test Workflow

#### Step 1: Register & Login

```http
POST http://localhost:5500/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

Copy the `token` from response.

#### Step 2: Verify Profile

```http
GET http://localhost:5500/api/users/me
Authorization: Bearer <COPIED_TOKEN>
```

Verify `points: 0` (initial state).

#### Step 3: Start Quest

```http
POST http://localhost:5500/api/userquests/start
Authorization: Bearer <COPIED_TOKEN>
Content-Type: application/json

{
  "quest_id": 1,
  "periode": "2025-11-29"
}
```

Copy the `id` from response.

#### Step 4: Update Quest Progress

```http
PATCH http://localhost:5500/api/userquests/<COPIED_ID>/progress
Authorization: Bearer <COPIED_TOKEN>
Content-Type: application/json

{
  "increment": 1
}
```

Repeat until `completed: true` (points will increase).

#### Step 5: Get Daily Quiz

```http
GET http://localhost:5500/api/quizzes/daily
Authorization: Bearer <COPIED_TOKEN>
```

Copy `question_id` and `choice_id` values.

#### Step 6: Submit Quiz

```http
POST http://localhost:5500/api/quizzes/daily/submit
Authorization: Bearer <COPIED_TOKEN>
Content-Type: application/json

{
  "answers": [
    { "question_id": 1, "selected_choice_id": 1 },
    { "question_id": 2, "selected_choice_id": 5 },
    { "question_id": 3, "selected_choice_id": 9 },
    { "question_id": 4, "selected_choice_id": 13 },
    { "question_id": 5, "selected_choice_id": 17 }
  ]
}
```

#### Step 7: Verify Points Increased

```http
GET http://localhost:5500/api/users/me
Authorization: Bearer <COPIED_TOKEN>
```

Confirm `points` have increased!

---

## Rate Limiting

Most endpoints are rate-limited for security purposes:

- **Default**: 100 requests per 15 minutes per IP address
- **Auth endpoints**: Same limit applies

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1764431960
```

---

## Performance Recommendations

1. **Cache leaderboard** – Fetch every 5 minutes, not per request
2. **Batch quiz submissions** – Validate on client-side before submitting
3. **Use pagination** – Implement `limit` and `page` parameters
4. **Index database columns** – Add indexes on frequently queried fields
5. **Connection pooling** – Use PostgreSQL connection pools

---

**Last Updated:** 29 November 2025  
**API Version:** 1.0.0  
**Status:** Production Ready ✅
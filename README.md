# ClimACT API 🌱

**RESTful API service powering the ClimACT climate action platform**

> *Turning climate intentions into measurable actions*

## 📋 Overview

This backend service provides the core functionality for ClimACT - a gamified climate action platform that helps users track sustainability tasks, reduce carbon footprint, and participate in environmental challenges.

## ✨ Features

- 🔐 **JWT Authentication** - Secure user registration and login with automatic points initialization
- 📋 **Quest System** - Daily and weekly recurring climate action challenges
- 📊 **Progress Tracking** - Real-time monitoring of user quest completion
- 🎯 **Period Validation** - Automatic validation for daily/weekly quest periods
- 🔒 **Data Security** - Ownership checks to ensure users can only access their own data
- ⚡ **Auto-completion** - Quests automatically complete when reaching target progress
- 🏆 **Points & Rewards** - Automatic points system where users gain points upon quest completion
- 👤 **User Profile** - View personal stats including points, completed quests, and progress

---

## 🎯 Core Modules

| Module | Description | Status |
|--------|-------------|--------| 
| 🔐 Authentication & User Management | Secure user accounts with JWT & automatic points init | ✅ **Done** |
| 📋 Task Engine | Dynamic daily/weekly climate action challenges | ✅ **Done** |
| 🏆 Gamification System | Points, achievements, and progress tracking | ✅ **Done** |
| 👤 User Profile & Stats | User profile with points and quest statistics | ✅ **Done** |
| 📊 Analytics Engine | Carbon footprint calculations and impact metrics | 🚧 **Dev** |
| 👥 Community Features | Events, groups, and social interactions | 🚧 **Dev** |

---

## 🚀 Quick Start

### Prerequisites

- Node.js v14 or higher
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/climact-api.git
cd climact-api
```

2. Install dependencies

```bash
npm install
```

3. Create `.env` file in root directory

```env
PORT=5500
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=1d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

4. Run the development server

```bash
npm start
```

Server will be running at `http://localhost:5500`

---

## 📁 Project Structure

```
climact-api/
├── routes/
│   ├── auth.routes.js        # Authentication endpoints
│   ├── quest.routes.js       # Quest management endpoints
│   ├── userquest.routes.js   # User quest progress endpoints
│   ├── user.routes.js        # User profile & points endpoints
│   └── public.routes.js      # Public endpoints (Leaderboard)
├── middlewares/
│   ├── auth.middleware.js    # JWT verification
│   └── errorHandler.middleware.js  # Error handling
├── utils/
│   ├── db.js                 # Database connection
│   ├── passport.js           # OAuth configuration
│   └── limiter.js            # Rate limiting
├── app.js                    # Express app setup
├── climact.sqlite            # SQLite database
├── .env                      # Environment variables
├── package.json
├── README.md
└── documentation.md
```

---

## 📖 API Documentation

For detailed API documentation, see [Documentation](./documentation.md)

### Quick Reference

#### Authentication

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `POST` | `/auth/register` | Create new user account | ✅ **Live** |
| `POST` | `/auth/login` | User authentication | ✅ **Live** |

#### User Profile

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `GET` | `/users/me` | Get current user profile & stats | ✅ **Live** |

#### Quest Management (Admin)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `GET` | `/quests` | Get all available quests | ✅ **Live** |
| `POST` | `/quests` | Create new quest | ✅ **Live** |
| `PATCH` | `/quests/:id` | Update quest | ✅ **Live** |
| `DELETE` | `/quests/:id` | Delete quest | ✅ **Live** |

#### User Quest Progress

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `POST` | `/userquest/start` | Start a quest | ✅ **Live** |
| `GET` | `/userquest` | Get user's active quests | ✅ **Live** |
| `PATCH` | `/userquest/:id/progress` | Update quest progress | ✅ **Live** |
| `PATCH` | `/userquest/:id/complete` | Complete quest manually | ✅ **Live** |

#### Public

| Method | Endpoint              | Description     | Status |
|--------|-----------------------|-----------------|--------|
| `GET`  | `/public/leaderboard` | Get Leaderboard | ✅ **Live** |

---

## 🏆 Points System

### How It Works

1. **Initial Points** - New users start with `0` points
2. **Progress Tracking** - Each time user updates progress, counter increments
3. **Auto Reward** - When progress reaches target (quest complete), points are automatically awarded
4. **Cumulative** - Points accumulate across multiple quests using INCREMENT query

### Example Flow

```
User: alice (points: 0)
Quest A: target=4, points=75

Step 1: Progress +1 → progress: 1/4 (points: 0, unchanged)
Step 2: Progress +1 → progress: 2/4 (points: 0, unchanged)
Step 3: Progress +1 → progress: 3/4 (points: 0, unchanged)
Step 4: Progress +1 → progress: 4/4 ✅ COMPLETE!
         → alice.points: 0 + 75 = 75

Profile endpoint now shows: points: 75
```

### Stats Available

When user calls `GET /users/me`, they get:

- **points** - Total accumulated points
- **total_quests** - Number of quests started
- **completed_quests** - Number of quests finished
- **total_progress** - Sum of progress from completed quests

---

## 🛠️ Tech Stack

**Runtime:** Node.js  
**Framework:** Express.js  
**Database:** SQLite (better-sqlite3)  
**Authentication:** JWT (jsonwebtoken)  
**Password Hashing:** bcryptjs  
**Date Utilities:** date-fns  
**OAuth:** Passport.js with Google Strategy

---

## 📦 Dependencies

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

## 🗄️ Database Schema

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

## 🧪 Testing

### Manual Testing with Thunder Client / Postman

1. Import the API collection or create requests manually
2. Set base URL: `http://localhost:5500`
3. Register a new user and get JWT token
4. Use the token in Authorization header for protected endpoints

Example Header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Recommended Test Flow

1. **Register new user** → `POST /auth/register`
2. **Login** → `POST /auth/login` (get token)
3. **Check profile** → `GET /users/me` (see initial 0 points)
4. **Create quest** → `POST /quests` (as admin or after setup)
5. **Start quest** → `POST /userquest/start`
6. **Update progress multiple times** → `PATCH /userquest/:id/progress`
7. **Complete quest** → Final progress update triggers points reward
8. **Check profile again** → `GET /users/me` (verify points increased)
9. **Security test** → Try accessing other user's quest (should get 403)

---

## 🔐 Security Features

- ✅ JWT token-based authentication with expiration
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Ownership validation on user resources
- ✅ Period-based quest validation (daily/weekly)
- ✅ Automatic token expiration (1 day default)
- ✅ SQL injection protection (prepared statements)
- ✅ Rate limiting on auth endpoints
- ✅ CORS protection with helmet middleware
- ✅ Input validation with express-validator

---

## 📊 Important Implementation Details

### Points Calculation

Points use **INCREMENT** query to prevent race conditions:

```javascript
UPDATE users SET points = points + ? WHERE id = ?
```

This ensures points are always added, not replaced, even with concurrent requests.

### Stats Query

Stats are calculated using aggregate functions:

```sql
SELECT 
  COUNT(*) as total_quests,
  COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_quests,
  SUM(CASE WHEN completed = 1 THEN progress ELSE 0 END) as total_progress
FROM user_quests WHERE user_id = ?
```

This ensures accurate counting of completed quests and their total progress.

### Period Validation

- **Daily:** Format `YYYY-MM-DD`, validated against current date
- **Weekly:** Format `YYYY-Wxx`, validated using `date-fns` library
- Validation only applies to progress/complete, not on start (user can start future quests)

---

## 🚧 Roadmap

- [x] Leaderboard (`GET /public/leaderboard`)
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

## 📝 License

This project is licensed under the Copyright (c) 2025 hrnns-ti - see the [LICENSE](./LICENSE) file for details.

---

## 👥 Authors

- [@haerunnas](https://github.com/hrnns-ti) - Informatics Engineering Student

---

## 📞 Contact & Support

For questions, bug reports, or feature requests:

- Open an issue on GitHub
- Contact the maintainers via email
- Check the documentation at `./documentation.md`

---

## 🙏 Acknowledgments

- Thanks to all contributors who help improve this project
- Built with passion for a sustainable future 🌍
- Special thanks to the ClimACT team adn Mrs. Dewi Khaerani M.Sc for the vision and direction

---

**ClimACT - Making climate action measurable and rewarding** ♻️

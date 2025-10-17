# ClimACT API 🌱

**RESTful API service powering the ClimACT climate action platform**

> *Turning climate intentions into measurable actions through robust backend infrastructure*

## 📋 Overview

This backend service provides the core functionality for ClimACT - a gamified climate action platform that helps users track sustainability tasks, reduce carbon footprint, and participate in environmental challenges.

## ✨ Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📋 **Quest System** - Daily and weekly recurring climate action challenges
- 📊 **Progress Tracking** - Real-time monitoring of user quest completion
- 🎯 **Period Validation** - Automatic validation for daily/weekly quest periods
- 🔒 **Data Security** - Ownership checks to ensure users can only access their own data
- ⚡ **Auto-completion** - Quests automatically complete when reaching target progress

---

## 🎯 Core Modules

| Module | Description | Status |
|--------|-------------|--------|
| 🔐 Authentication & User Management | Secure user accounts with JWT | ✅ **Done** |
| 📋 Task Engine | Dynamic daily/weekly climate action challenges | ✅ **Done** |
| 🏆 Gamification System | Points, achievements, and progress tracking | 🚧 **Dev** |
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
├── src/
│   ├── routes/
│   │   ├── auth.routes.js        # Authentication endpoints
│   │   ├── quest.routes.js       # Quest management endpoints
│   │   └── userquest.routes.js   # User quest progress endpoints
│   ├── middlewares/
│   │   ├── auth.middleware.js    # JWT verification
│   │   └── errorHandler.js       # Error handling
│   ├── config/
│   │   └── db.js                 # Database connection
│   └── app.js                    # Express app setup
├── database/
│   └── climact.db                # SQLite database
├── .env                          # Environment variables
├── package.json
├── README.md
└── documentation.md
```

---

## 📖 API Documentation

For detailed API documentation, see [[ Documentation ]](./documentation.md)

### Quick Reference

#### Authentication

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `POST` | `/auth/register` | Create new user account | ✅ **Live** |
| `POST` | `/auth/login` | User authentication | ✅ **Live** |

#### Quest Management (Admin)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `GET` | `/quests` | Get all quests | ✅ **Live** |
| `POST` | `/quests` | Create new quest | ✅ **Live** |
| `PATCH` | `/quests/:id` | Update quest | ✅ **Live** |
| `DELETE` | `/quests/:id` | Delete quest | ✅ **Live** |

#### User Quest Progress

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `POST` | `/userquest/start` | Start a quest | ✅ **Live** |
| `GET` | `/userquest` | Get user's quest history | ✅ **Live** |
| `PATCH` | `/userquest/:id/progress` | Update quest progress | ✅ **Live** |
| `PATCH` | `/userquest/:id/complete` | Complete quest manually | ✅ **Live** |

---

## 🛠️ Tech Stack

**Runtime:** Node.js  
**Framework:** Express.js  
**Database:** SQLite (better-sqlite3)  
**Authentication:** JWT (jsonwebtoken)  
**Password Hashing:** bcryptjs  
**Date Utilities:** date-fns

---

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "better-sqlite3": "^8.5.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "date-fns": "^2.30.0"
}
```

---

## 🗄️ Database Schema

### Table: users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
```

### Table: quest
```sql
CREATE TABLE quest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  category TEXT CHECK(category IN ('daily', 'weekly')),
  target INTEGER DEFAULT 1,
  deadline TEXT
);
```

### Table: user_quests
```sql
CREATE TABLE user_quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  quest_id INTEGER NOT NULL,
  periode TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  finished TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quest_id) REFERENCES quest(id),
  UNIQUE(user_id, quest_id, periode)
);
```

---

## 🧪 Testing

### Manual Testing with Thunder Client / Postman

1. Import the API collection
2. Set base URL: `http://localhost:5500`
3. Register a new user and get JWT token
4. Use the token in Authorization header for protected endpoints

Example:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Test Flow

1. Register new user → `POST /auth/register`
2. Login and get token → `POST /auth/login`
3. Create quest → `POST /quests`
4. Start quest → `POST /userquest/start`
5. Update progress → `PATCH /userquest/:id/progress`
6. Check completion → `GET /userquest`

---

## 🔐 Security Features

- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Ownership validation on user resources
- ✅ Period-based quest validation (daily/weekly)
- ✅ Automatic token expiration
- ✅ SQL injection protection (prepared statements)

---

## 🚧 Roadmap

- [ ] Points and rewards system
- [ ] Leaderboard functionality
- [ ] Badge and achievement system
- [ ] Quest statistics and analytics
- [ ] Notification system
- [ ] Quest recommendation engine
- [ ] Social features (friends, groups)
- [ ] Carbon footprint calculator

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- [@hearunnas](https://github.com/hrnns-ti)

---

## 📞 Contact

For questions or support, please open an issue on GitHub or contact the maintainers.

---

## 🙏 Acknowledgments

- Thanks to everyone that help me to improve this project
- Built with passion for a sustainable future 🌍

---

**ClimACT**
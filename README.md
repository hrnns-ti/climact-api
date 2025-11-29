# 🌍 ClimACT API

**A RESTful API powering the ClimACT gamified climate action platform.**

> Turn climate intentions into measurable actions. Every mission matters. Every point counts.

---

## 📋 Overview

ClimACT API is a backend service that empowers users to track, measure, and earn rewards for their sustainability actions. From recycling to using public transportation, every action is converted into points and achievements, creating a gamified experience that drives environmental engagement.

### ✨ Core Features

- **🔐 Secure Authentication** – JWT-based auth with bcrypt password hashing
- **🎯 Quest System** – Daily & weekly climate action challenges
- **📊 Progress Tracking** – Real-time monitoring with period-based validation
- **💰 Points & Rewards** – Automatic point allocation on quest completion & quiz submission
- **📝 Article Management** – Create, publish, and manage environmental content
- **🧩 Counter System** – Track activities: recycling, reusing items, public transport usage
- **🏆 Leaderboard & Badges** – Competitive rankings and achievement system
- **📚 Daily Quiz** – Environmental knowledge quizzes with scoring
- **🔄 Password Reset** – OTP-based password recovery via email (6-digit, 10-min expiry)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Runtime** | Node.js v22+ |
| **Framework** | Express.js 4.18+ |
| **Database** | PostgreSQL 12+ |
| **Authentication** | JWT + bcryptjs |
| **Email Service** | Nodemailer (Gmail SMTP) |
| **Input Validation** | express-validator |
| **Security** | Helmet, CORS, Rate Limiting |
| **Deployment** | Render |

---

## 📦 Quick Start

### Prerequisites

```bash
- Node.js v22 or higher
- PostgreSQL 12 or higher
- Git
- npm or yarn
```

### 1️⃣ Clone & Install

```bash
git clone https://github.com/hrnns-ti/climact-api-production.git
cd climact-api-production
npm install
```

### 2️⃣ Environment Configuration

Create `.env` file in root directory:

```env
# Server
PORT=5500
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/climact_db

# JWT Configuration
JWT_SECRET=your_super_secret_key_here_min_32_characters
JWT_EXPIRE=24h

# Email (Gmail with App Password)
EMAIL=your_email@gmail.com
EMAIL_PASSWORD=your_16_digit_app_password

# Optional: Google OAuth (for future mobile integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3️⃣ Database Setup

```bash
# Create PostgreSQL database
createdb climact_db

# Run automatic migrations (creates all tables)
npm run migrate
```

### 4️⃣ Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will be running at `http://localhost:5500` ✅

---

## 📚 Database Schema

### Core Tables

#### `users`
```sql
id SERIAL PRIMARY KEY
username VARCHAR UNIQUE NOT NULL
email VARCHAR UNIQUE
password VARCHAR NOT NULL
points INTEGER DEFAULT 0
reset_token VARCHAR
reset_expires BIGINT
created_at TIMESTAMP DEFAULT NOW()
```

#### `quest`
```sql
id SERIAL PRIMARY KEY
name VARCHAR UNIQUE NOT NULL
description TEXT
category VARCHAR CHECK (category IN ('daily', 'weekly'))
points INTEGER DEFAULT 0
target INTEGER DEFAULT 1
deadline TIMESTAMP NOT NULL
created TIMESTAMP DEFAULT NOW()
```

#### `user_quests`
```sql
id SERIAL PRIMARY KEY
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
quest_id INTEGER REFERENCES quest(id) ON DELETE CASCADE
progress INTEGER DEFAULT 0
completed BOOLEAN DEFAULT FALSE
periode VARCHAR NOT NULL (YYYY-MM-DD or YYYY-Wxx format)
started TIMESTAMP DEFAULT NOW()
finished TIMESTAMP
UNIQUE(user_id, quest_id, periode)
```

#### `user_counters`
```sql
id SERIAL PRIMARY KEY
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
counter_name VARCHAR NOT NULL
value INTEGER DEFAULT 0
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, counter_name)
```

#### `articles`
```sql
id SERIAL PRIMARY KEY
author_id INTEGER REFERENCES users(id) ON DELETE CASCADE
title VARCHAR UNIQUE NOT NULL
content TEXT
status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'))
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### `quiz_questions` & `quiz_choices`
```sql
-- Questions
id SERIAL PRIMARY KEY
question_text TEXT NOT NULL
category VARCHAR
created_at TIMESTAMP DEFAULT NOW()

-- Choices
id SERIAL PRIMARY KEY
question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE
choice_text TEXT NOT NULL
is_correct BOOLEAN DEFAULT FALSE
```

#### `quiz_sessions`
```sql
id SERIAL PRIMARY KEY
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
session_date DATE DEFAULT CURRENT_DATE
score INTEGER
total_questions INTEGER
points_earned INTEGER
created_at TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, session_date)
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Create new user account |
| `POST` | `/api/auth/login` | ❌ | User login (username or email) |
| `GET` | `/api/auth/profile` | ✅ | Get user profile |
| `POST` | `/api/auth/forgot` | ❌ | Request password reset OTP |
| `POST` | `/api/auth/reset/new` | ❌ | Reset password with OTP |

### Users & Points

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/users/me` | ✅ | Get profile & stats |
| `GET` | `/api/users/summary` | ✅ | Get counter summary |
| `POST` | `/api/users/:counter/inc` | ✅ | Increment counter |
| `GET` | `/api/users/me/badges` | ✅ | Get user badges |

### Quests

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/quests` | ❌ | List all quests |
| `POST` | `/api/userquests/start` | ✅ | Start a quest |
| `GET` | `/api/userquests` | ✅ | Get user's quests |
| `PATCH` | `/api/userquests/:id/progress` | ✅ | Update quest progress |

### Quiz

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/quizzes/daily` | ✅ | Get daily quiz (5 questions) |
| `POST` | `/api/quizzes/daily/submit` | ✅ | Submit answers & get score |

### Articles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/articles` | ✅ | List published articles |
| `POST` | `/api/articles` | ✅ | Create new article |
| `PATCH` | `/api/articles/:id` | ✅ | Publish/update article |
| `DELETE` | `/api/articles/:id` | ✅ | Delete article |

### Public

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/public/leaderboard` | ❌ | Top users by points |
| `GET` | `/api/public/badges` | ❌ | List all badges |

---

## 🧪 Testing

### Setup REST Client

Use the provided `climact-api.rest` file to test all endpoints:

```bash
# 1. Install VS Code extension "REST Client"
# 2. Open climact-api.rest file
# 3. Set @token variable after login
# 4. Click "Send Request" on each endpoint
```

### Complete Test Flow

**1. Authentication**
```
POST /api/auth/register → POST /api/auth/login → Copy JWT token
```

**2. Quest Flow**
```
GET /api/quests → POST /api/userquests/start → PATCH /api/userquests/:id/progress
```

**3. Quiz Flow**
```
GET /api/quizzes/daily → POST /api/quizzes/daily/submit
```

**4. Verify Points**
```
GET /api/users/me → Confirm points increased
```

---

## 🔐 Security Features

✅ **JWT Authentication** – Token-based, 24-hour expiry  
✅ **Password Hashing** – bcrypt with 8 rounds  
✅ **Ownership Validation** – Users can only access their own data  
✅ **Period Validation** – Daily/weekly format enforcement  
✅ **Rate Limiting** – 100 requests per 15 minutes per IP  
✅ **Input Validation** – express-validator with sanitization  
✅ **Security Headers** – Helmet middleware (CSP, X-Frame, etc.)  
✅ **CORS Protection** – Origin validation  
✅ **OTP Security** – 6-digit codes, 10-minute expiry, single-use  
✅ **User Enumeration Protection** – Consistent responses for valid/invalid emails  

---

## 🚀 Deployment on Render

### Automatic Deployment Setup

1. **Push to GitHub** (without `.env` file)

```bash
git add .
git commit -m "Update API features"
git push origin main
```

2. **Render detects push** → Auto-builds and deploys

3. **Set environment variables in Render Dashboard**:
   - `DATABASE_URL` (PostgreSQL connection)
   - `JWT_SECRET`
   - `EMAIL` and `EMAIL_PASSWORD`

4. **App goes live** in 5-10 minutes ✅

### Database Migrations (Production)

Render automatically runs `npm run migrate` before starting the server.

---

## 📋 Project Structure

```
climact-api-production/
├── app.js                          # Express application setup
├── lib/
│   └── database.js                # PostgreSQL connection pool
├── middleware/
│   ├── auth.js                    # JWT verification middleware
│   └── error.js                   # Global error handler
├── routes/
│   ├── auth.js                    # Auth endpoints
│   ├── user.js                    # User profile & stats
│   ├── quest.js                   # Quest management
│   ├── userquest.js               # User quest progress
│   ├── quiz.js                    # Daily quiz & submission
│   ├── article.js                 # Article CRUD operations
│   └── public.js                  # Public endpoints
├── scripts/
│   ├── migrate.js                 # Database schema setup
│   └── smoke-test.js              # Automated test suite
├── package.json
├── .env.example
└── README.md
```

---

## 🐛 Troubleshooting

### "Missing credentials for PLAIN" (Email Error)

**Solution:**
1. Verify `.env` contains `EMAIL` and `EMAIL_PASSWORD`
2. Use Gmail App Password (16 digits), NOT regular password
3. Enable 2-Factor Authentication in Gmail
4. Generate App Password at https://myaccount.google.com/apppasswords

### "column is_active does not exist"

This error has been resolved. All queries have been updated to remove the `is_active` filter, as this column is not part of the schema.

### OTP Email Not Sending

- Verify `.env` `EMAIL` and `EMAIL_PASSWORD` are correct
- Confirm Gmail App Password is accurate (16 characters)
- Check email spam folder

---

## 📈 System Workflows

### Points System Flow

```
User starts quest (points = 0)
    ↓
Update progress multiple times (points unchanged)
    ↓
Progress reaches target → QUEST COMPLETE!
    ↓
Auto-award points to user (example: +50)
    ↓
Submit quiz → +2 points per correct answer
    ↓
Total points increase on leaderboard
```

### Counter System Flow

```
POST /api/users/trash_recycled/inc (amount: 5)
    ↓
Auto-create counter if not exists
    ↓
Value becomes 5
    ↓
Next increment: becomes 10
    ↓
Decrement cannot go below 0
```

### Password Reset (OTP-Based)

```
POST /api/auth/forgot (email)
    ↓
Generate 6-digit OTP, store in database
    ↓
Email OTP to user (valid 10 minutes)
    ↓
User submits: POST /api/auth/reset/new (token, newPassword)
    ↓
Validate token + password requirements (min 8 chars)
    ↓
Hash password, clear reset tokens
    ↓
Login with new password ✅
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Copyright © 2025 hrnns-ti - All Rights Reserved

See LICENSE file for details.

---

## 👨‍💻 Contributors

- **haerunnas** – Backend Developer, Informatics Engineering
- **Mrs. Dewi Khaerani M.Sc** – Project Vision & Supervision

---

## 📞 Support

- 📧 **Issues** – GitHub Issues
- 💬 **Discussions** – GitHub Discussions
- 📖 **Documentation** – See `documentation.md` for detailed API reference

---

**Turn climate action into measurable impact. Build a sustainable future together.** 🌱
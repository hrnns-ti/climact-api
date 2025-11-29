-- USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    reset_token TEXT,
    reset_expires BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- QUEST
CREATE TABLE IF NOT EXISTS quest (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('daily', 'weekly')),
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP NOT NULL,
    target INTEGER NOT NULL DEFAULT 1 CHECK (target > 0)
    );

-- USER_QUESTS (progress/user/quest/periode)
CREATE TABLE IF NOT EXISTS user_quests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id INTEGER NOT NULL REFERENCES quest(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished TIMESTAMP,
    periode VARCHAR(20),
    UNIQUE (user_id, quest_id, periode)
    );

-- BADGES
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    requirement TEXT,
    image_url TEXT
    );

-- USER_BADGES
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, badge_id)
    );

-- USER_STREAKS
CREATE TABLE IF NOT EXISTS user_streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    streak_count INTEGER DEFAULT 1 CHECK (streak_count >= 0),
    last_completed_date VARCHAR(20)
    );

-- ARTICLES
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT UNIQUE NOT NULL,
    content TEXT,
    status VARCHAR(20) CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- QUIZ_SESSIONS
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    score INTEGER DEFAULT 0 CHECK (score >= 0),
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE (user_id, date)
);

-- QUIZ_QUESTIONS
CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL
);

-- QUIZ_CHOICES
CREATE TABLE IF NOT EXISTS quiz_choices (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    choice_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE
);

-- QUIZ_ANSWERS
CREATE TABLE IF NOT EXISTS quiz_answers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_choice_id INTEGER NOT NULL REFERENCES quiz_choices(id) ON DELETE CASCADE
    );

-- USER_COUNTERS
CREATE TABLE IF NOT EXISTS user_counters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counter_name TEXT NOT NULL,
    value INTEGER DEFAULT 0 CHECK (value >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, counter_name)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_quest ON user_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_periode ON user_quests(periode);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_counters_user ON user_counters(user_id);
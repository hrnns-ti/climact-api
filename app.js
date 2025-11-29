// app.js - Climact API Complete Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const db = require('./lib/database');

const authRoutes = require('./routes/auth');
const questRoutes = require('./routes/quest');
const userRoutes = require('./routes/user');
const userquestRoutes = require('./routes/userquest');
const publicRoutes = require('./routes/public');
const articleRoutes = require('./routes/article');
const quizRoutes = require('./routes/quiz');

const { authLimiter, apiLimiter } = require('./middleware/limiter.middleware');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// =============== SECURITY MIDDLEWARE ===================
app.use(helmet());

// =============== CORS ===================
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-flutter-app.com']
        : true,
    credentials: true
}));

// =============== BODY PARSER ===================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// =============== DISABLE X-POWERED-BY ===================
app.disable('x-powered-by');

// =============== RATE LIMITING ===================
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// =============== HEALTH CHECK ===================
app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV,
            db: 'connected'
        });
    } catch (err) {
        res.status(500).json({ status: 'error', db: 'disconnected' });
    }
});

// =============== ROUTES ===================
app.use('/api/auth', authRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/users', userRoutes);
app.use('/api/userquests', userquestRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/quizzes', quizRoutes);

app.get('/api', (req, res) => {
    res.json({
        message: 'Climact API v1.0 - COMPLETE!',
        endpoints: {
            health: 'GET /health',
            public: [
                'GET /api/public/leaderboard',
                'GET /api/public/leaderboard/:id',
                'GET /api/public/badges',
                'GET /api/public/popular-quests'
            ],
            auth: [
                'POST /api/auth/register',
                'POST /api/auth/login',
                'POST /api/auth/forgot',
                'POST /api/auth/reset/check',
                'POST /api/auth/reset/new'
            ],
            quests: [
                'GET /api/quests',
                'GET /api/quests/:id',
                'POST /api/quests (admin)',
                'PATCH /api/quests/:id (admin)',
                'DELETE /api/quests/:id (admin)'
            ],
            users: [
                'GET /api/users/me (protected)',
                'GET /api/users/me/badges (protected)',
                'GET /api/users/summary (protected)',
                'POST /api/users/:counterName/inc (protected)',
                'POST /api/users/:counterName/dec (protected)'
            ],
            userquests: [
                'POST /api/userquests/start (protected)',
                'PATCH /api/userquests/:id/progress (protected)',
                'PATCH /api/userquests/:id/complete (protected)',
                'GET /api/userquests (protected)'
            ],
            articles: [
                'GET /api/articles',
                'GET /api/articles/:id',
                'POST /api/articles (auth)',
                'PATCH /api/articles/:id (author)',
                'DELETE /api/articles/:id (author)',
                'GET /api/articles/me (auth)'
            ],
            quizzes: [
                'GET /api/quizzes/daily (protected)',
                'POST /api/quizzes/daily/submit (protected)',
                'GET /api/quizzes/history (protected)'
            ]
        }
    });
});

// =============== 404 HANDLER ===================
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// =============== GLOBAL ERROR HANDLER ===================
app.use(errorHandler);

// =============== START SERVER ===================
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`🚀 Climact API running on port ${PORT}`);
    console.log(`📱 Health check available at http://localhost:${PORT}/health`);
});

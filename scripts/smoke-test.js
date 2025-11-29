// scripts/smoke-test.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = `http://localhost:${process.env.PORT || 5500}`;

async function main() {
    console.log('🚀 Running Climact API smoke test...\n');

    const username = 'tester_' + Math.floor(Math.random() * 100000);
    const email = `${username}@example.com`;
    const password = 'password123';

    let token = null;
    let questId = null;
    let userQuestId = null;

    const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true
    });

    // Helper
    const log = (label, res) => {
        console.log(`\n=== ${label} ===`);
        console.log('Status:', res.status);
        console.log('Body:', JSON.stringify(res.data, null, 2));
    };

    try {
        // 1. HEALTH
        const health = await client.get('/health');
        log('HEALTH', health);

        // 2. REGISTER
        const register = await client.post('/api/auth/register', {
            username,
            email,
            password,
            confirmPassword: password
        });
        log('REGISTER', register);

        if (!register.data.token) throw new Error('Register failed, no token.');

        // 3. LOGIN
        const login = await client.post('/api/auth/login', {
            identifier: username,
            password
        });
        log('LOGIN', login);

        token = login.data.token;
        if (!token) throw new Error('Login failed, no token.');

        const authClient = axios.create({
            baseURL: BASE_URL,
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });

        // 4. PROFILE
        const profile = await authClient.get('/api/auth/profile');
        log('PROFILE', profile);

        // 5. LIST QUESTS
        const quests = await client.get('/api/quests');
        log('QUESTS LIST', quests);

        if (!Array.isArray(quests.data.quests || quests.data) || (quests.data.quests || quests.data).length === 0) {
            throw new Error('No quests available for testing.');
        }

        const questList = quests.data.quests || quests.data;
        questId = questList[0].id;

        // 6. START USER QUEST (daily, periode = today)
        const today = new Date().toISOString().slice(0, 10);
        const startQuest = await authClient.post('/api/userquests/start', {
            quest_id: questId,
            periode: today
        });
        log('START QUEST', startQuest);

        userQuestId = startQuest.data.id;

        // 7. UPDATE PROGRESS
        const progress = await authClient.patch(`/api/userquests/${userQuestId}/progress`, {
            increment: 5
        });
        log('UPDATE PROGRESS', progress);

        // 8. SUMMARY COUNTERS
        const incCounter = await authClient.post('/api/users/trash_recycled/inc', {
            amount: 3
        });
        log('INCREMENT COUNTER', incCounter);

        const summary = await authClient.get('/api/users/summary');
        log('SUMMARY', summary);

        // 9. GET DAILY QUIZ
        const quiz = await authClient.get('/api/quizzes/daily');
        log('QUIZ DAILY', quiz);

        if (!Array.isArray(quiz.data.quiz) || quiz.data.quiz.length === 0) {
            throw new Error('No quiz questions available.');
        }

        // Ambil semua jawaban pertama saja (bisa benar/belum tentu)
        const answers = quiz.data.quiz.map(q => ({
            question_id: q.id,
            selected_choice_id: q.choices[0].choice_id
        }));

        const submitQuiz = await authClient.post('/api/quizzes/daily/submit', { answers });
        log('QUIZ SUBMIT', submitQuiz);

        console.log('\n✅ Smoke test selesai tanpa error fatal.\n');
    } catch (err) {
        console.error('\n❌ Smoke test error:', err.message);
    }
}

main();

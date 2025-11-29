const db = require('../lib/database');

async function awardBadgesForUser(user) {
    try {
        const badgesResult = await db.query('SELECT * FROM badges');
        const badges = badgesResult.rows;

        for (const badge of badges) {
            try {
                const requirement = JSON.parse(badge.requirement || '{}');

                let meetsRequirement = true;
                for (const [counterName, requiredValue] of Object.entries(requirement)) {
                    const counterResult = await db.query(
                        'SELECT value FROM user_counters WHERE user_id = $1 AND counter_name = $2',
                        [user.id, counterName]
                    );

                    const currentValue = counterResult.rows[0]?.value || 0;
                    if (currentValue < requiredValue) {
                        meetsRequirement = false;
                        break;
                    }
                }

                if (meetsRequirement) {
                    const existingResult = await db.query(
                        'SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2',
                        [user.id, badge.id]
                    );

                    if (existingResult.rows.length === 0) {
                        await db.query(
                            'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)',
                            [user.id, badge.id]
                        );
                        console.log(`🎖️ Badge "${badge.name}" awarded to user ${user.id}`);
                    }
                }
            } catch (err) {
                console.error(`Error checking badge ${badge.id}:`, err);
            }
        }
    } catch (err) {
        console.error('awardBadgesForUser error:', err);
    }
}

async function calculateStreakForUser(userId) {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const recentResult = await db.query(`
            SELECT DISTINCT periode, COUNT(*) as completions 
            FROM user_quests 
            WHERE user_id = $1 
            AND completed = true 
            AND periode IN ($2, $3)
            GROUP BY periode
        `, [userId, today, yesterday]);

        const recent = recentResult.rows;

        let streakCount = 0;
        if (recent.some(r => r.periode === today)) {
            streakCount = 1;
            if (recent.some(r => r.periode === yesterday)) {
                const streakResult = await db.query(
                    'SELECT streak_count FROM user_streaks WHERE user_id = $1',
                    [userId]
                );
                streakCount = (streakResult.rows[0]?.streak_count || 0) + 1;
            }
        }

        await db.query(
            `INSERT INTO user_streaks (user_id, streak_count, last_completed_date) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (user_id) 
             DO UPDATE SET streak_count = $2, last_completed_date = $3`,
            [userId, streakCount, today]
        );

        return { streakCount };
    } catch (err) {
        console.error('calculateStreakForUser error:', err);
        return { streakCount: 0 };
    }
}

module.exports = {
    awardBadgesForUser,
    calculateStreakForUser
};

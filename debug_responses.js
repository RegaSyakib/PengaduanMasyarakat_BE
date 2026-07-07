const pool = require('./config/db');

async function debug() {
    try {
        console.log('--- USERS TABLE ---');
        const [users] = await pool.query('SELECT id, name, email, role FROM users');
        console.table(users);

        console.log('\n--- RESPONSES TABLE WITH REAL ADMIN NAMES ---');
        const [responses] = await pool.query(`
            SELECT r.id, r.complaint_id, r.admin_id, u.name as real_admin_name, r.message, r.created_at 
            FROM responses r 
            JOIN users u ON r.admin_id = u.id
            ORDER BY r.created_at DESC LIMIT 5
        `);
        console.table(responses);

        process.exit(0);
    } catch (error) {
        console.error('Debug failed:', error);
        process.exit(1);
    }
}

debug();

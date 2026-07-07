const pool = require('./config/db');

async function fixName() {
    try {
        const [result] = await pool.query(
            "UPDATE users SET name = 'Admin Biasa' WHERE id = 1"
        );
        console.log('Name updated successfully! Rows affected:', result.affectedRows);
        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
}

fixName();

const pool = require('./config/db');

async function migrateNotifications() {
    try {
        console.log('Connecting to database and executing notifications table migration...');
        
        await pool.query(`DROP TABLE IF EXISTS notifications`);
        await pool.query(`
            CREATE TABLE notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                complaint_id INT NOT NULL,
                admin_id INT DEFAULT NULL,
                message TEXT NOT NULL,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        console.log('Notifications table has been checked/created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateNotifications();

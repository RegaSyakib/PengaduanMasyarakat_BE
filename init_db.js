const pool = require('./config/db');

async function initDatabase() {
    try {
        console.log('[DB-INIT] Checking and initializing database schema...');

        // 1. Table users
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('super_admin', 'admin', 'user') DEFAULT 'user',
                profile_image VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Table complaints
        await pool.query(`
            CREATE TABLE IF NOT EXISTS complaints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                image VARCHAR(255) DEFAULT NULL,
                status ENUM('pending', 'process', 'done', 'approved', 'rejected') DEFAULT 'pending',
                category VARCHAR(100) DEFAULT 'Lainnya',
                latitude DECIMAL(10, 8) DEFAULT NULL,
                longitude DECIMAL(11, 8) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 3. Table comments
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                complaint_id INT NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
            )
        `);

        // 4. Table likes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                complaint_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_like (user_id, complaint_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
            )
        `);

        // 5. Table notifications
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
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

        // 6. Table responses
        await pool.query(`
            CREATE TABLE IF NOT EXISTS responses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                complaint_id INT NOT NULL,
                admin_id INT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 7. Insert default admin users
        await pool.query(`
            INSERT INTO users (name, email, password, role) 
            VALUES ('Admin Biasa', 'admin@admin.com', '$2b$10$T.MsEmfvNV7/LyQffMRZIOdL9AS9WKOy/rfohXTa2RMjzp9FZa0FG', 'admin')
            ON DUPLICATE KEY UPDATE id=id
        `);

        await pool.query(`
            INSERT INTO users (name, email, password, role) 
            VALUES ('Super Admin Utama', 'super@admin.com', '$2b$10$X1n1w8z7iXy9Z71kM2k0r.eHw8N3bX9u2Jt6T.y5lZ1xK7e3Q7N.W', 'super_admin')
            ON DUPLICATE KEY UPDATE id=id
        `);

        // Default demo user (password: user123)
        await pool.query(`
            INSERT INTO users (name, email, password, role) 
            VALUES ('Warga Masyarakat', 'warga@user.com', '$2b$10$f6655LwS4.zT2k.P2o70Z.9w6YxXbWvA0s8j3Yt56P9r8LwO6lBwe', 'user')
            ON DUPLICATE KEY UPDATE id=id
        `);

        console.log('[DB-INIT] ✓ Database initialized successfully with default users!');
        return true;
    } catch (error) {
        console.error('[DB-INIT] Error initializing database:', error.message);
        return false;
    }
}

if (require.main === module) {
    initDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = initDatabase;


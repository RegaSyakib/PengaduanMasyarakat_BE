const pool = require('./config/db');

async function fixSchema() {
    try {
        console.log('--- Fixing MySQL Database Schema ---');
        
        // 1. Drop accidental duplicate table 'comment'
        await pool.query('DROP TABLE IF EXISTS comment');
        console.log('✓ Dropped stray table `comment`');

        // 2. Update complaints status ENUM
        await pool.query(`
            ALTER TABLE complaints 
            MODIFY COLUMN status ENUM('pending', 'process', 'done', 'approved', 'rejected') DEFAULT 'pending'
        `);
        console.log('✓ Updated `complaints.status` ENUM to include approved & rejected');

        // 3. Ensure users table has profile_image and proper role ENUM
        const [userCols] = await pool.query('SHOW COLUMNS FROM users LIKE "profile_image"');
        if (userCols.length === 0) {
            await pool.query('ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL');
            console.log('✓ Added `profile_image` to `users`');
        }

        await pool.query(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('super_admin', 'admin', 'user') DEFAULT 'user'
        `);
        console.log('✓ Updated `users.role` ENUM');

        // 4. Ensure complaints has category, latitude, longitude
        const [catCols] = await pool.query('SHOW COLUMNS FROM complaints LIKE "category"');
        if (catCols.length === 0) {
            await pool.query('ALTER TABLE complaints ADD COLUMN category VARCHAR(100) DEFAULT "Lainnya"');
            console.log('✓ Added `category` to `complaints`');
        }

        const [latCols] = await pool.query('SHOW COLUMNS FROM complaints LIKE "latitude"');
        if (latCols.length === 0) {
            await pool.query('ALTER TABLE complaints ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL');
            console.log('✓ Added `latitude` to `complaints`');
        }

        const [lngCols] = await pool.query('SHOW COLUMNS FROM complaints LIKE "longitude"');
        if (lngCols.length === 0) {
            await pool.query('ALTER TABLE complaints ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL');
            console.log('✓ Added `longitude` to `complaints`');
        }

        // 5. Ensure likes table exists
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
        console.log('✓ Ensured table `likes` exists');

        // 6. Ensure comments table exists
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
        console.log('✓ Ensured table `comments` exists');

        console.log('All schema fixes applied successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Schema fix error:', error);
        process.exit(1);
    }
}

fixSchema();

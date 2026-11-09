const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function cleanReports() {
    try {
        console.log('--- Cleaning Complaints History & Uploads (Preserving User Accounts) ---');

        // 1. Get all active profile images from users to preserve
        const [users] = await pool.query('SELECT profile_image FROM users WHERE profile_image IS NOT NULL');
        const preservedFiles = new Set(
            users
                .map(u => u.profile_image)
                .filter(Boolean)
                .map(img => path.basename(img))
        );
        console.log('User profile images to preserve:', Array.from(preservedFiles));

        // 2. Clean up uploads folder (delete complaint images, keep profile images)
        const uploadsDir = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            let deletedCount = 0;
            let preservedCount = 0;

            for (const file of files) {
                if (preservedFiles.has(file)) {
                    preservedCount++;
                } else {
                    fs.unlinkSync(path.join(uploadsDir, file));
                    deletedCount++;
                }
            }
            console.log(`✓ Uploads directory cleaned: ${deletedCount} complaint images deleted, ${preservedCount} profile images preserved.`);
        }

        // 3. Delete records from database tables
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        
        await pool.query('TRUNCATE TABLE notifications');
        console.log('✓ Truncated `notifications` table (reset ID to 1)');

        await pool.query('TRUNCATE TABLE responses');
        console.log('✓ Truncated `responses` table (reset ID to 1)');

        await pool.query('TRUNCATE TABLE comments');
        console.log('✓ Truncated `comments` table (reset ID to 1)');

        await pool.query('TRUNCATE TABLE likes');
        console.log('✓ Truncated `likes` table (reset ID to 1)');

        await pool.query('TRUNCATE TABLE complaints');
        console.log('✓ Truncated `complaints` table (reset ID to 1)');

        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        // 4. Verify users are intact
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log(`✓ Verified: All ${userCount[0].count} user accounts remain intact!`);

        console.log('\nAll complaint history successfully cleaned! System is now fresh and ready for new reports.');
        process.exit(0);
    } catch (error) {
        console.error('Clean reports error:', error);
        process.exit(1);
    }
}

cleanReports();

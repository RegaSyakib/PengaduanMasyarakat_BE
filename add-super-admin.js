const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function updateRoles() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'pengaduan_masyarakat'
    });

    console.log('Connected to DB. Updating roles...');

    // Update ENUM to include super_admin
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('super_admin', 'admin', 'user') DEFAULT 'user'
    `);
    console.log('Role ENUM updated.');

    // Create default super_admin
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    
    // Check if super admin already exists
    const [existing] = await connection.query('SELECT * FROM users WHERE email = ?', ['super@admin.com']);
    
    if (existing.length === 0) {
      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Super Admin Utama', 'super@admin.com', hashedPassword, 'super_admin']
      );
      console.log('Default super_admin created (super@admin.com / superadmin123).');
    } else {
      console.log('super_admin already exists.');
    }

    await connection.end();
  } catch (error) {
    console.error('Error updating roles:', error);
  }
}

updateRoles();

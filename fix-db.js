const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'pengaduan_masyarakat'
    });
    
    const hash = await bcrypt.hash('admin123', 10);
    await conn.query('UPDATE users SET password=? WHERE email=?', [hash, 'admin@admin.com']);
    
    console.log('Admin password properly fixed!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();

const mysql = require('mysql2/promise');

async function addCoordinates() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // default laragon password
      database: 'pengaduan_masyarakat'
    });

    console.log('Connected to DB. Adding latitude and longitude...');
    
    try {
      await connection.query('ALTER TABLE complaints ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL');
    } catch(e) { console.log('latitude might already exist'); }

    try {
      await connection.query('ALTER TABLE complaints ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL');
    } catch(e) { console.log('longitude might already exist'); }
    
    console.log('Columns processed successfully!');
    
    // Example: Depok area coordinates
    await connection.query(`
      UPDATE complaints 
      SET latitude = -6.385589 + (RAND() * 0.01), 
          longitude = 106.830711 + (RAND() * 0.01)
      WHERE latitude IS NULL
    `);
    console.log('Mock locations added to existing complaints.');

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

addCoordinates();

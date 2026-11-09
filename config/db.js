const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let pool;

const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (connectionUri) {
    const isSsl = process.env.DB_SSL === 'true' || 
                  process.env.MYSQL_SSL === 'true' || 
                  connectionUri.includes('ssl=') ||
                  !connectionUri.includes('localhost');

    pool = mysql.createPool({
        uri: connectionUri,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ...(isSsl ? { ssl: { rejectUnauthorized: false } } : {})
    });
} else {
    const isSsl = process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true';

    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pengaduan_masyarakat',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: isSsl ? { rejectUnauthorized: false } : undefined
    });
}

module.exports = pool;

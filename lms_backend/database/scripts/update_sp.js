
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function updateSP() {
    const config = {
        host: process.env.DB_HOST || 'DESKTOP-IK6ME8M',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'xenoclass',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        multipleStatements: true
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected to database');

        const sqlPath = path.join(__dirname, '../sql/get_video_attendance.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await connection.query(sql);
        console.log('Successfully updated Get_VideoAttendance stored procedure');

        await connection.end();
    } catch (err) {
        console.error('Error updating SP:', err);
        process.exit(1);
    }
}

updateSP();

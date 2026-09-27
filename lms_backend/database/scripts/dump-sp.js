const mysql = require('mysql2/promise');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function listSPs() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
            database: process.env.DB_NAME || 'xenoclass',
            port: parseInt(process.env.DB_PORT, 10) || 3306
        });
        
        console.log('✅ Connected');
        
        const dbName = process.env.DB_NAME || 'xenoclass';
        const [rows] = await connection.query(`SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = '${dbName}' AND ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_NAME = 'check_User'`);
        
        for (const row of rows) {
            console.log(`--- PROCEDURE: ${row.ROUTINE_NAME} ---`);
            const [createRows] = await connection.query(`SHOW CREATE PROCEDURE ${row.ROUTINE_NAME}`);
            console.log(createRows[0]['Create Procedure']);
        }
        
        await connection.end();
    } catch (err) {
        console.error(err);
    }
}

listSPs();


const mysql = require('mysql2/promise');
const env = require('./env');

// Create one shared MySQL connection pool.
const pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Verify database connectivity.
async function testConnection() {
    const connection = await pool.getConnection();

    try {
        const [rows] = await connection.query('SELECT 1 AS result');

        return rows[0].result;
    } finally {
        connection.release();
    }
}

module.exports = {
    pool,
    testConnection,
};

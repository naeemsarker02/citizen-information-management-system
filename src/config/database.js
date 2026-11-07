const mysql = require('mysql2/promise');
const env = require('./env');

// Aiven MySQL requires SSL in production. Local dev does not.
// DB_SSL is set to "true" only in the Render environment.
const poolConfig = {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
};

if (process.env.DB_SSL === 'true') {
    // Aiven free tier uses a self-signed CA.
    // rejectUnauthorized:false is acceptable for a demo;
    // production would pin the CA certificate.
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

async function testConnection() {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query('SELECT 1 AS result');
        return rows[0].result;
    } finally {
        connection.release();
    }
}

module.exports = { pool, testConnection };
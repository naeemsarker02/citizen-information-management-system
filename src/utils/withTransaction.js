
const { pool } = require('../config/database');

const MAX_DEADLOCK_RETRIES = 1;

async function withTransaction(work) {
    if (typeof work !== 'function') {
        throw new TypeError('Transaction callback must be a function.');
    }

    for (
        let attempt = 0;
        attempt <= MAX_DEADLOCK_RETRIES;
        attempt += 1
    ) {
        let connection;
        let transactionStarted = false;

        try {
            // Acquire a connection from the shared pool.
            connection = await pool.getConnection();

            // Start the transaction.
            await connection.beginTransaction();
            transactionStarted = true;

            // All transactional queries must use this connection.
            const result = await work(connection);

            // Commit before returning the result.
            await connection.commit();
            transactionStarted = false;

            return result;
        } catch (error) {
            // Roll back any failed transaction.
            if (connection && transactionStarted) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        '[withTransaction] Rollback failed:',
                        rollbackError
                    );
                }
            }

            // Retry only MySQL deadlock errors, at most once.
            const isDeadlock =
                error && error.code === 'ER_LOCK_DEADLOCK';

            const retriesRemain =
                attempt < MAX_DEADLOCK_RETRIES;

            if (!isDeadlock || !retriesRemain) {
                throw error;
            }
        } finally {
            // Always release the acquired connection.
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = withTransaction;

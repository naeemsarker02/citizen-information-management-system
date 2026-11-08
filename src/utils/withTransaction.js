
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
            connection = await pool.getConnection();

            await connection.beginTransaction();
            transactionStarted = true;

            const result = await work(connection);

            await connection.commit();
            transactionStarted = false;

            return result;
        } catch (error) {
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

            const isDeadlock =
                error && error.code === 'ER_LOCK_DEADLOCK';

            const retriesRemain =
                attempt < MAX_DEADLOCK_RETRIES;

            if (!isDeadlock || !retriesRemain) {
                throw error;
            }
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = withTransaction;

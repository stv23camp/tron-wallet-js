const sentry = require('../library/sentry_obj');
const db_mysql = require('../library/db_mysql');

(
    async () => {
        try {
            console.log('...evaluating');
            await db_mysql.createTablePayments();
            await db_mysql.createTableCounter();
            await db_mysql.createTableCounterTrc20();
            await db_mysql.createTableAddresses();
            await db_mysql.createTableTransactionsTrc20();
            await db_mysql.createTableTransactions();
        } catch(e) {
            sentry.captureException(e.message);
        }
    }
)();


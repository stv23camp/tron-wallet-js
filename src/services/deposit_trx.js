const cron = require('node-cron');
require('dotenv').config();
const sentry = require('../library/sentry_obj');
const deposit = require('../controllers/deposit');

cron.schedule("*/2 * * * *", async function(){
    try {
        await deposit.scanTrx();
    } catch(e) {
        sentry.captureException(e.message);
    }
});
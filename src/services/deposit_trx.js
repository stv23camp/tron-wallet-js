const cron = require('node-cron');
require('dotenv').config();
const sentry = require('../library/sentry_obj');
const deposit = require('../controllers/deposit');

cron.schedule("* * * * *", async function(){
    try {
        await deposit.scanTrx();
    } catch(e) {
        console.log(e);
        sentry.captureException(e);
    }
});
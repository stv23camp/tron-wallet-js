const cron = require('node-cron');
require('dotenv').config();
const sentry = require('../library/sentry_obj');
const forward = require('../controllers/forward');

cron.schedule("30 * * * *", async function(){
    try {
        await forward.sendTrxToPool();
    } catch(e) {
        sentry.captureException(e.message);
    }
});
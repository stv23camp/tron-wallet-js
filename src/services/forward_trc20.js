const cron = require('node-cron');
require('dotenv').config();
const sentry = require('../library/sentry_obj');
const forward = require('../controllers/forward');

cron.schedule("45,50 * * * *", async function(){
    try {
        await forward.sendTokenToPool('usdt');
    } catch(e) {
        console.log(e);
        sentry.captureException(e);
    }
});
const deposit = require('../controllers/deposit_manual');


(
    async () => {
        await deposit.scanTrx(44430633);
    }
)();
require('dotenv').config();
const tron = require('../library/tron');
const db = require('../library/db');
const encryption = require('../library/encryption');

async function sendTrxToPool(){
    const poolAddr = process.env.POOL;

    // get 100 recent TRX incoming txs from DB
    const txs = await db.getTransactionsNative();
    const receivers = txs.map((item)=>{
        return item.to;
    });
    // reduce txs into distinct addresses
    const distinct_addresses = [...new Set(receivers)];
    
    // iterate addresses
    for (let addr of distinct_addresses) {
        // getbalance for this address
        const balance = await tron.getBalanceNative(addr);
        const balance_raw = balance * 10**6;
        // if balance <=10 skip 
        if (balance<=10) continue;

        // forward to pool
        const encrypted = await db.getPrivate(addr);

        if (!encrypted) {
            console.log('pk not found');
            continue;
        }

        const decrypted = encryption.decryptKey(encrypted);

        console.log(`sending ${balance} trx from ${addr}`)
        const txid = await tron.sendNative(addr, poolAddr, balance_raw, decrypted);

        // if sending failed inform admin via throw
        if (!txid || txid.length!=64) {
            throw new Error('Forward trx failed');
            continue;
        }

        // console log success
        console.log('Success tx: ', txid);
    }
    console.log('forwarding session ended');
}

async function sendTokenToPool(token){
    const poolAddr = process.env.POOL;

    // get recent trc20 txs
    const txs = await tron.getTransactionsTrc20();
    const receivers = txs.map((item)=>{
        return item.to;
    });

    // reduce to distinct addresses
    const distinct_addresses = [...new Set(receivers)];

    // get trc20 configs
    const conf = require('../configs/token.config.json')[token];
    console.log(conf);

    // iterate distinct addresses
    for (let addr of distinct_addresses) {

        const balance_token = await tron.getBalanceTrc20(addr, conf.contract, conf.digit);
        // if no trc20 balance, continue
        if (balance_token<conf.min_balance) continue;

        const balance_trx = await tron.getBalanceNative(addr);
        // if trx balance < 5
        if (balance_trx<5) {
            // replenish trx for gas
            const amount_raw = 5 * 10**6;
            const encrypted = await db.getPrivate(process.env.SECRET);
            const decrypted = await encryption.decryptKey(encrypted);

            const txid = await tron.sendNative(poolAddr, addr, amount_raw, decrypted);

            if (!txid || txid.length!=64 ){
                throw new Error(`replenix trx failed`);
            }
        } else { // else 
            // forward to pool
            const balance_raw = balance_token *10**conf.digit;
            const encrypted = await db.getPrivate(addr);
            const decrypted = await encryption.decryptKey(encrypted);

            const txid = await tron.sendToken(addr, poolAddr, balance_raw, decrypted);

            if (!txid || txid.length!=64 ){
                throw new Error(`forwarding ${token} failed`);
            }
        }
    } // end for distinct_addresses
}

module.exports = {
    sendTrxToPool: sendTrxToPool,
    sendTokenToPool: sendTokenToPool
};
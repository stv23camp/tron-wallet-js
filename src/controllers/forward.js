require('dotenv').config();
const tron = require('../library/tron');
const db = require('../library/db_mysql');
const encryption = require('../library/encryption');

function delay(ms){
    return new Promise(async (resolve)=>{
        setTimeout(()=>resolve(), ms);
    });
}

function getNative(addr){
    return new Promise(async (resolve)=>{
        const result = await tron.getBalanceNative(addr);
        resolve(result);
    });
}

function getUsdt(addr, contract, digit){
    return new Promise(async (resolve)=>{
        const result = await tron.getBalanceTrc20(addr, contract, digit);
        resolve(result);
    });
}

function getPk(addr){
    return new Promise( async (resolve) => {
        const encrypted = await db.getPrivate(addr);
        resolve(encrypted);
    });
}

function sendTrx(addr, poolAddr, balance_raw, decrypted) {
    return new Promise(async (resolve) => {
        const txid = await tron.sendNative(addr, poolAddr, balance_raw, decrypted);
        resolve(txid);
    });
}

function sendUsdt(addr, poolAddr, balance_raw, contract, decrypted){
    return new Promise(async (resolve) => {
        const txid = await tron.sendToken(addr, poolAddr, balance_raw, contract, decrypted);
        resolve(txid);
    });
}

async function sendTrxToPool(){
    const poolAddr = process.env.POOL;
    const txs = await db.getTransactionsNative();
    const receivers = txs.map((item)=>{
        return item.to;
    });

    console.log('receivers: ', receivers.length);

    const receivers_filt = receivers.filter((item)=>{
        if (item!=poolAddr) return true;
    });
    console.log('poolAddr removed: ', receivers_filt.length);
    
    const distinct_addresses = [...new Set(receivers_filt)];
    console.log('unique: ', distinct_addresses.length);

    for (let addr of distinct_addresses) {
        const balance = await getNative(addr);
        const balance_float = parseFloat(balance);
        await delay(1000);
        console.log(balance);
        const balance_raw = balance_float * 10**6;
        if (balance_float<=10) continue;
        console.log(addr);
        const encrypted = await getPk(addr);
        if (!encrypted) {
            console.log('pk not found');
            continue;
        }
        const decrypted = encryption.decryptKey(encrypted);
        console.log(`sending ${balance} trx from ${addr}`)
        const txid = await sendTrx(addr, poolAddr, balance_raw, decrypted);
        if (!txid || txid.length!=64) {
            throw new Error('Forward trx failed');
            continue;
        }
        console.log('Success tx: ', txid);
    }
    console.log('forwarding session ended');
}

async function sendTokenToPool(token){
    const poolAddr = process.env.POOL;

    const txs = await db.getTransactionsTrc20();
    const receivers = txs.map((item)=>{
        return item.to;
    });

    console.log('receivers: ', receivers.length);

    const receivers_filt = receivers.filter((item)=>{
        if (item!=poolAddr) return true;
    });

    console.log('poolAddr removed', receivers_filt.length);
    
    const distinct_addresses = [...new Set(receivers_filt)];
    console.log('unique ', distinct_addresses.length);

    const conf = require('../configs/token.config.json')[token];

    for (let addr of distinct_addresses) {
        const balance_str = await getUsdt(addr, conf.contract, conf.digit);
        const balance_float = parseFloat(balance_str);
        console.log(`found token: ${balance_str}`);
        await delay(1000);

        if (balance_float<conf.min_balance) continue; 

        const balance_trx_str = await getNative(addr);
        const balance_trx_float = parseFloat(balance_trx_str);

        if (balance_trx_float<parseFloat(process.env.TRXFORGAS)) { 
            const amount_raw = parseFloat(process.env.TRXFORGAS) * 10**6;
            const encrypted = process.env.SECRET;
            const decrypted = encryption.decryptKey(encrypted);

            console.log('replenish gas to: ', addr);
            const txid = await sendTrx(poolAddr, addr, amount_raw, decrypted);

            if (!txid || txid.length!=64 ){
                throw new Error(`replenish trx failed`);
            }
            console.log(`successful native tx: ${txid}`);
        } else {
            // forward to pool
            const balance_raw = balance_float *10**conf.digit;
            const encrypted = await getPk(addr);
            const decrypted = encryption.decryptKey(encrypted);

            const txid = await sendUsdt(addr, poolAddr, balance_raw, conf.contract, decrypted);

            if (!txid || txid.length!=64 ){
                throw new Error(`forwarding ${token} failed`);
            }
            console.log(`successful token tx: ${txid}`);
        }   
    }
    console.log('forwarding session ended');
}

module.exports = {
    sendTrxToPool: sendTrxToPool,
    sendTokenToPool: sendTokenToPool
};
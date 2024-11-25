require('dotenv').config();
const tron = require('./src/library/tron');
const encryption = require('./src/library/encryption');

async function fund(){

    const poolAddr = 'TS8YrofnctymbQ5KfQooDx18VUeT99515f';
    const addr = 'TKsPtJFSDnMJFPrcJb97uwuG6SXfiGB8ss';

    const decrypted = encryption.decryptKey('');

    const balance = 10;
    const balance_raw = parseFloat(balance) * 10**6;

    console.log(`sending ${balance} trx for funding`)
    const txid = await tron.sendNative(poolAddr, addr , balance_raw, decrypted);
    console.log(txid);

    // const decrypted = encryption.decryptKey('');
    // const fromAddr = 'TKsPtJFSDnMJFPrcJb97uwuG6SXfiGB8ss';
    // const toAddr = 'TVhdaKnGe9HA1474x2SZ1LcbEqmQc76nMG';
    // const amount = 1400;
    // const contractAddr = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    // const amount_raw = parseFloat(amount) * 10**6;

    // const txid = await tron.sendToken(fromAddr, toAddr, amount_raw, contractAddr, decrypted);
    // console.log(txid);

}

(
    async () => {
       await fund();
    }
)();
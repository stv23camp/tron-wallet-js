require('dotenv').config();
const tron = require('../library/tron')
const db = require('../library/db_mysql');

function delay(ms){
    return new Promise(async (resolve)=>{
        setTimeout(()=>resolve(), ms);
    });
}

async function scanTrx(block){
    const poolAddr = process.env.POOL;

    const txs = await tron.transactionByBlock(block);

    if (!txs) return;

    const addresses = await db.getAddresses();

    console.log(`processing block ${block} , txs: ${txs.length}`);

    for (const tx of txs) { 
        const contract_type = tx.raw_data.contract[0].type.toLowerCase();
        if (!contract_type || contract_type!='transfercontract') continue;

        const to_address = tron.addressFromHex(tx.raw_data.contract[0].parameter.value.to_address);            
        
      
        if (to_address==poolAddr) continue; 

  
        if (!addresses.includes(to_address)) continue;

        const amount_raw = tx.raw_data.contract[0].parameter.value.amount;
        const amount_real = amount_raw * 1e-6;

       
        const sender_address = tron.addressFromHex(tx.raw_data.contract[0].parameter.value.owner_address);
        if (sender_address==poolAddr) continue; // skip if sender is pool, potentially forwarding gas

        const txid = tx.txID;
        console.log(txid);

       
        const isExist = await db.isTrxExist(txid);
        if (isExist) {
            console.log(`tx: ${txid} already recorded`);
            continue;
        }

        await db.insertTransactionNative(txid, sender_address, to_address, amount_real, block); 

        console.log(`new tx: ${txid}`);
    }
}

module.exports = {
    scanTrx: scanTrx
};
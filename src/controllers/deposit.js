require('dotenv').config();
const tron = require('../library/tron')
const db = require('../library/db_mysql');

function delay(ms){
    return new Promise(async (resolve)=>{
        setTimeout(()=>resolve(), ms);
    });
}

function addCounter(block){
    return new Promise(async (resolve)=>{
        await db.updateCounter(block);
        resolve();
    });
}

function addCounterTrc20(block){
    return new Promise(async (resolve)=>{
        await db.updateCounterTrc20(block);
        resolve();
    });
}

async function scanTrx(){
    const poolAddr = process.env.POOL;
    
    // get counter from DB
    const last_block_str = await db.getLastBlock();
    const last_block = parseInt(last_block_str);
    
    // get latest block
    const latest_block = await tron.getBlockHeight();
   
    // find delta between: latest_block and last_recorded_block
    const delta = latest_block-last_block;

    // if < 20 exit
    if (delta<20) return;

    // get addresses
    const addresses = await db.getAddresses();
    
    let new_txs_count = 0;
    // loop from last_recorded towards latest_block
    for (let i=last_block+1; i<=latest_block; i++) {
        // get transactions_by_block
        const txs = await tron.transactionByBlock(i);
        await addCounter(i);

        if (!txs) continue;

        console.log(`processing block ${i} , txs: ${txs.length}`);

        for (const tx of txs) { // iterate each tx
            const contract_type = tx.raw_data.contract[0].type.toLowerCase();
            if (!contract_type || contract_type!='transfercontract') continue;

            const to_address = tron.addressFromHex(tx.raw_data.contract[0].parameter.value.to_address);            
            
            // skip pool address as destination
            if (to_address==poolAddr) continue; 

            // if no to_address, skip
            if (!addresses.includes(to_address)) continue;

            const amount_raw = tx.raw_data.contract[0].parameter.value.amount;
            const amount_real = amount_raw * 1e-6;

            // if amount <= 15 TRX, skip
            if (amount_real<parseFloat(process.env.MINDEPOSIT)) continue;

            // if sender is pool, skip
            const sender_address = tron.addressFromHex(tx.raw_data.contract[0].parameter.value.owner_address);
            if (sender_address==poolAddr) continue; // skip if sender is pool, potentially forwarding gas

            const txid = tx.txID;
            console.log(txid);

            // if hash exists in recorded txs, skip
            const isExist = await db.isTrxExist(txid);
            if (isExist) {
                console.log(`tx: ${txid} already recorded`);
                continue;
            }
            // insert new tx to DB
            // i -> current block processed
            await db.insertTransactionNative(txid, sender_address, to_address, amount_real, i); 

            console.log(`new tx: ${txid}`);

            // increment new_txs_count;
            new_txs_count++;

        } // end txs iter

        // get current sec in the minute
        var d = new Date;
        let seconds = d.getSeconds();
        if (seconds>55){
            console.log('exiting...');
            return;
        }        
    } // end blocknumber check
}

function isTokenTxExist(txid){
    return new Promise(async (resolve)=>{
        const isExist = await db.isTrc20Exist(txid);
        resolve(isExist);
    });
}

function insertTokenTx(token, txid, from, to, amount, block){
    return new Promise(async (resolve)=>{
        await db.insertTransactionTrc20(token, txid, from, to, amount, block);
        resolve();
    });
}

async function scanTrc20(token){
    const poolAddr = process.env.POOL;

    // get last recorded block
    const last_block_str = await db.getLastBlockTrc20();
    const last_block = parseInt(last_block_str);

    // get latest block
    const latest_block = await tron.getBlockHeight();

    const delta = latest_block-last_block;

    // if < 20 exit
    if (delta<20) return;

    // get trc20 configs
    const conf = require('../configs/token.config.json')[token];

    // get addresses
    const addresses = await db.getAddresses();

    let new_txs_count = 0;
    // iterate from latest_block + 1
    for (let i=last_block+1; i<=latest_block; i++) {

        // get transactions by block number
        const txs = await tron.getEventsByBlock(i, [], '');
        await addCounterTrc20(i);

        await delay(1000);

        console.log(`processing block ${i} , txs: ${txs.length}`);

        if (txs.length==0) continue;

        // iterate pages
        for(let tx of txs){
            if (tx.contract_address!=conf.contract) continue; // contract address validation

            if (tx.event_name.toLowerCase()!='transfer') continue; // event type validation

            const to = tron.addressFromHex(tx.result['1']);
            const from = tron.addressFromHex(tx.result['0']);

            // skip if source / destination is poolAddr
            if (to==poolAddr) continue;
            if (from==poolAddr) continue;

            if (!addresses.includes(to)) continue; // address not found

            const txid = tx.transaction_id;
            const divisor = 10 ** conf.digit;
            const amount = parseFloat(tx.result['2']) / divisor;

            // if hash exists in recorded txs, skip
            const isExist = await isTokenTxExist(txid);
            if (isExist) {
                console.log(`tx: ${txid} already recorded`);
                continue;
            }

            // insert record to trc20_counter
            await insertTokenTx(token, txid, from, to, amount, i);

            console.log(`new tx: ${txid}`);

            new_txs_count++;
        } // all txs

        // get current sec in the minute
        var d = new Date;
        let seconds = d.getSeconds();
        if (seconds>55){
            console.log('exiting...');
            return;
        }
    } // blocks
}

module.exports = {
    scanTrx: scanTrx,
    scanTrc20: scanTrc20
};
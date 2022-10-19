require('dotenv').config();
const tron = require('../library/tron')
const db = require('../library/db_mysql');

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

    // get recent 100 deposit txs
    const recorded_txs = await db.getTransactionsNative();
    const recorded_txids = recorded_txs.map((item)=>{
        return item.txid
    });
    
    let new_txs_count = 0;
    // loop from last_recorded towards latest_block
    for (let i=last_block+1; i<=latest_block; i++) {
        // get transactions_by_block
        const txs = await tron.transactionByBlock(i);

        if (!txs) continue;

        console.log(`processing block ${i} , txs: ${txs.length}`);

        for (const tx of txs) { // iterate each tx
            const contract_type = tx.raw_data.contract[0].type.toLowerCase();
            if (!contract_type || contract_type!='transfercontract') continue;

            const to_address = tron.addressFromHex(tx.raw_data.contract[0].parameter.value.to_address);            
            
            // if no to_address, skip
            if (!addresses.includes(to_address)) continue;

            const amount_raw = tx.raw_data.contract[0].parameter.value.amount;
            const amount_real = amount_raw * 1e-6;

            // if amount <= 10 TRX, skip
            if (amount_real<10) continue;

            // if sender is pool, skip
            const sender_address = tron.addressFromHex(tx.raw_data.contract[0].parameter.value.owner_address);
            if (sender_address==poolAddr) continue;

            const txid = tx.txID;
            console.log(txid);

            // if hash exists in recorded txs, skip
            if (recorded_txids.includes(txid)) {
                console.log(`tx: ${txid} already recorded`);
                continue;
            }
            // insert new tx to DB
            // i -> current block processed
            await db.insertTransactionNative(txid, sender_address, to_address, amount_real, i); 

            console.log(`new tx: ${txid}`)

            // increment new_txs_count;
            new_txs_count++;

        } // end txs iter

        await db.updateCounter(i);
    } // end blocknumber check
}

async function scanTrc20(token){
    // get latest block
    //const latest_block = await tron.getBlockHeight();
    //console.log(latest_block);
    const latest_block = 30658266;

    // get last recorded block
    //const last_block = await db.getLastBlockTrc20();
    //console.log(last_block);
    const last_block = 30658265;

    const delta = latest_block-last_block;

    // if < 20 exit
    //if (delta<20) return;

    // get trc20 configs
    const conf = require('../configs/token.config.json')[token];
    console.log(conf);

    // get addresses
    const addresses = await db.getAddresses();

    // get trc20 transactions
    const recorded_txs = await db.getTransactionsTrc20();
    const recorded_txids = recorded_txs.map((item)=>{
        return item.txid
    });

    let new_txs_count = 0;
    // iterate from latest_block + 1
    for (let i=last_block+1; i<=latest_block; i++) {
        // get transactions by block number
        const txs = await tron.getEventsByBlock(i, [], '');
        // iterate pages
        for(let tx of txs){
            if (tx.contract_address!=conf.contract) continue;

            if (tx.event_name.toLowerCase()!='transfer') continue;

            const to = tron.addressFromHex(tx.result.to);
            //console.log('to :', to);

            if (!addresses.includes(to)) {
                console.log('address not found');
                continue;
            }

            const from = tron.addressFromHex(tx.result.from);
            //console.log('from ', from);

            const txid = tx.transaction_id;
            //console.log(txid);
            const divisor = 10 ** conf.digit;
            const amount = parseFloat(tx.result.value) / divisor;
            //console.log(amount);

            if (recorded_txids.includes(txid)) {
                console.log('tx already recorded');
            }

            // insert record to trc20_counter
            db.insertTransactionTrc20(token, txid, from, to, amount, i);
        } // all txs

        await db.updateCounterTrc20(i);
    } // blocks
}

module.exports = {
    scanTrx: scanTrx,
    scanTrc20: scanTrc20
};
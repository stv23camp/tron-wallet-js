require('dotenv').config();
const axios = require('axios');
const BigNumber = require('bignumber.js');

/*----- Tron SDK -----*/
const TronWeb = require('tronweb');
const tronWeb = new TronWeb({
    fullNode: process.env.API,
    solidityNode: process.env.API,
    eventServer: process.env.API,
    privateKey: process.env.PASSIVE
});

tronWeb.setHeader({
    'TRON-PRO-API-KEY': process.env.TRONGRIDKEY
});

async function getBlockHeight(){ 
    const block = await tronWeb.trx.getCurrentBlock();
    const number = block.block_header.raw_data.number;
    return number;
}

async function sendToken(from, to, amount_raw, contractAddr, privKey){
    const parameter = [
        {type:'address', value:to},
        {type:'uint256', value:amount_raw.toString()}
    ];
    const options = {
        feeLimit: 100000000
    }
    
    const transactionObj = await tronWeb.transactionBuilder.triggerSmartContract(
        tronWeb.address.toHex(contractAddr),
        "transfer(address,uint256)",
        options,
        parameter,
        tronWeb.address.toHex(from)
    );

    const signedTxn = await tronWeb.trx.sign(transactionObj.transaction, privKey);
    const receipt = await tronWeb.trx.sendRawTransaction(signedTxn);
    console.log(receipt.transaction.txID);
    return receipt.transaction.txID;
}

async function sendNative(from, to, amount_raw, fromPk){
    const tradeObj = await tronWeb.transactionBuilder.sendTrx(to, amount_raw.toString(), from, 1);
    const signedTxn = await tronWeb.trx.sign(tradeObj, fromPk);
    const receipt = await tronWeb.trx.sendRawTransaction(signedTxn);
    console.log(receipt.txid);
    return receipt.txid;
}

async function getEventsByPage(block, nexturl=''){
    /*------ construct config ------*/
    const url = `${process.env.API}/v1/blocks/${block}/events?limit=200`;
  
    const config = {
        url: nexturl=='' ? url : nexturl, // use default url for first page
        method: 'get',
        headers: {
            'TRON-PRO-API-KEY': process.env.TRONGRIDKEY,
            'Content-Type': 'application/json'
        }
    }
    /*------ promisify awaited process ------*/
    return new Promise(async (resolve, reject) =>{
        const res = await axios.request(config);
        if (!res.data.data) {
            reject('no events found');
        }
        const response = {
            events: res.data.data,
            nexturl: !res.data.meta.fingerprint ? '' : res.data.meta.links.next
        }
        resolve(response);
    }); 
}

async function getEventsByBlock(block, events, url){
    // call async process and finally returns events after all pages retrieved
    return getEventsByPage(block, url).then(function(response){ 
        let events_ = events;
        events_.push(...response.events);

        return new Promise(function(resolve, _reject){

            if (response.nexturl==''){
                resolve(events_);
            } else {
                return resolve(getEventsByBlock(block, events_, response.nexturl));
            }
        });
    }); // catch would bubble up to sentry
}

async function transactionByBlock(block){
    const result = await tronWeb.trx.getBlockByNumber(block);
    return result.transactions;
}

function addressFromHex(hex){
    return tronWeb.address.fromHex(hex);
}

async function getBalanceTrc20(address, contractAddr, digit){
    const contract = await tronWeb.contract().at(contractAddr);
    const hex = await contract.balanceOf(address).call();
    
    BigNumber.config({ DECIMAL_PLACES: digit});
    const raw = new BigNumber(hex._hex);
    const ten = new BigNumber(10);
    const divisor = ten.exponentiatedBy(digit);
    const balance = raw.dividedBy(divisor);

    return balance.toString();
}

async function getBalanceNative(targetAddr) {
    let raw = await tronWeb.trx.getBalance(targetAddr);
    raw = new BigNumber(raw);
    BigNumber.config({ DECIMAL_PLACES: 6 });
    const ten = new BigNumber(10);
    const divisor = ten.exponentiatedBy(6);
    const balance = raw.dividedBy(divisor);

    return balance.toString();
}

async function isAddressValid(addr){
    return await tronWeb.isAddress(addr);
}

async function createAddress(){
    return await tronWeb.createAccount(); 
}

module.exports = {
    getBlockHeight: getBlockHeight,
    sendToken: sendToken,
    sendNative: sendNative,
    transactionByBlock: transactionByBlock,
    addressFromHex: addressFromHex,
    getEventsByBlock: getEventsByBlock,
    getBalanceTrc20: getBalanceTrc20,
    getBalanceNative: getBalanceNative,
    isAddressValid: isAddressValid,
    createAddress: createAddress
};

require('dotenv').config();
const xmlrpc = require('express-xmlrpc');
const BigNumber = require('bignumber.js');
const conf = require('../configs/token.config.json');
const encryption = require('../library/encryption');
const db = require('../library/db_mysql');
const tron = require('../library/tron');

async function getTokenBalance(req, res){
    try {
        const [_user, _hash, token, _args2, _args3, _nonce] = req.body.params;

        const targetAddr = process.env.POOL;
        const contractAddr = conf[token].contract; 
        const digit = conf[token].digit;

        const balance = await tron.getBalanceTrc20(targetAddr, contractAddr, digit);
        
        res.send(xmlrpc.serializeResponse({balance: balance.toString()}));
    } catch(e) {
        res.send(xmlrpc.serializeFault(500, e.message));
    }
}

async function getNativeBalance(_req, res){
    try {
        const targetAddr = process.env.POOL;
        const balance = await tron.getBalanceNative(targetAddr);  
        res.send(xmlrpc.serializeResponse({balance: balance.toString()}));
    } catch(e) {
        res.send(xmlrpc.serializeFault(500, e.message));
    }
}

async function validateAddress(req, res){

    const [_user, _hash, addr, _args2, _args3, _nonce] = req.body.params;

    if(!addr){ // ideally FE already validated this
        res.send(xmlrpc.serializeFault(401, "missing args1: address"));
        return;
    }

    if(addr[0]!=='T'){
        res.send(xmlrpc.serializeResponse(false));
        return;
    }
 
    try {
        const isValid = await tron.isAddressValid(addr);   
        res.send(xmlrpc.serializeResponse(isValid));
    } catch(e) {
        res.send(xmlrpc.serializeFault(500, e.message));
    }
}

async function generateAddress(){
   
    const raw = await tron.createAddress(); // create address keypair

    const address = raw.address.base58;
    const encrypted_pk = encryption.encryptKey(raw.privateKey);
            
    // save to DB
    try {
        await db.insertAddress(address, encrypted_pk);
    } catch(e) {
        res.send(xmlrpc.serializeFault(500, e.message));
        return;
    }
    
    res.send(xmlrpc.serializeResponse({address: address}));
}

module.exports = {
    validateAddress: validateAddress,
    getNativeBalance: getNativeBalance,
    getTokenBalance: getTokenBalance,
    generateAddress: generateAddress
};
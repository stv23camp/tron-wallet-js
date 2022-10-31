require('dotenv').config();
const encryption = require('../library/encryption');
const xmlrpc = require('express-xmlrpc');
const db = require('../library/db_mysql');
const tron = require('../library/tron');
const conf = require('../configs/token.config.json');
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

async function _duplicateCheck(asset_code, to, amount){
    const payments = await db.getPayments();

    const payments_duplicate = payments.filter(function(tx){
        console.log(tx);
        if (tx.asset_code==asset_code && tx.wd_address==to && tx.amount==amount && tx.memo==memo) {
            return true;
        }
    });

    if (payments_duplicate.length>0) {
        console.log('duplicate requests');
        return true;
    }

    return false;
}

async function transferToken(req, res){ 
    const [_user, _hash, token, json_payload, _args3, _nonce] = req.body.params; // sanitized by authenticate   
    
    try {
        const fromAddr = process.env.POOL;
        const payload = JSON.parse(json_payload);
        const toAddress = payload.to;
        
        const contractAddr = conf[token].contract;
        const digit = conf[token].digit;

        const amount_real = Math.floor(payload.amount);
        const amount_raw = amount_real *10**digit;

        const isDuplicate = await _duplicateCheck(token, toAddress, amount_real);
        if (isDuplicate) {
            res.send(xmlrpc.serializeFault(406, 'potential duplicate requests'));
            return;
        }

        const decrypted = encryption.decryptKey(payload.pass);
        
        const txid = await tron.sendToken(fromAddr, toAddress, amount_raw, contractAddr, decrypted)

        await db.insertPayment(token, toAddress, amount_real);
        
        res.send(xmlrpc.serializeResponse({txid: txid})); 
    } catch(e) {
        res.send(xmlrpc.serializeFault(500, e.message));
    }
    
}

async function transferNative(req, res){
    const [_user, _hash, toAddr, value, pass, _nonce] = req.body.params;

    try {

        const isDuplicate = await _duplicateCheck('trx', toAddr, value);
        if (isDuplicate) {
            res.send(xmlrpc.serializeFault(406, 'potential duplicate requests'));
            return;
        }

        const fromAddr = process.env.POOL;
        const amount_raw = Math.floor(value) * 10**6;
        const decrypted = encryption.decryptKey(pass);
        const txid = await tron.sendNative(fromAddr, toAddr, amount_raw, decrypted);

        await db.insertPayment('trx', toAddr, value.toString());

        res.send(xmlrpc.serializeResponse({txid: txid})); 
    } catch(e) {
        res.send(xmlrpc.serializeFault(500, e.message));
    }
}

module.exports = {
    transferToken: transferToken,
    transferNative: transferNative
};
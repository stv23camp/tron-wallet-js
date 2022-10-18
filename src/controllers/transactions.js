require('dotenv').config();
const xmlrpc = require('express-xmlrpc');
const db = require('../library/db_mysql');

async function getPaymentsNative(_req, res){
    try{
        const txs = await db.getTransactionsNative();
        res.send(xmlrpc.serializeResponse({txs: txs}));
    }catch(e){
        res.send(xmlrpc.serializeFault(500, 'get native txs error'));
    }
}

async function getPaymentsTrc20(_req, res){
    try{
        const txs = await db.getTransactionsTrc20();
        res.send(xmlrpc.serializeResponse({txs: txs}));
    }catch(e){
        res.send(xmlrpc.serializeFault(500, 'get native txs error'));
    }
}

module.exports = {
    getPaymentsNative: getPaymentsNative,
    getPaymentsTrc20: getPaymentsTrc20
}
require('dotenv').config();
const xmlrpc = require('express-xmlrpc');
const crypto = require('crypto');
const database = require('../library/db_sqlite');
const {performance} = require('perf_hooks');

function microtime() {
    let now = performance.now();
    let sec = Math.floor(now / 1000);
    let usec = Math.floor((now % 1000) * 1000);
    return usec + ' ' + sec;
}

async function checkLogin(req, res, next){  
    if (!req.body || !req.body.params) { 
        res.send(xmlrpc.serializeFault(400, "params empty"));
        return;
    }

    const [param_user, param_hash, _args1, _args2, _args3, param_nonce] = req.body.params;

    if (param_user!=process.env.SERVERUSER) {
        res.send(xmlrpc.serializeFault(401, "invalid rpc user"));
        return;
    }

    const nonce_db = await database.getNonce();
    if (!nonce_db){
        res.send(xmlrpc.serializeFault(401, "failed to get db nonce"));
        return;
    }

    if (param_nonce<=nonce_db) {
        res.send(xmlrpc.serializeFault(401, "nonce too low"));
        return;
    }

    // nonce is greater, then update
    try {
        await database.updateNonce(nonce_db, param_nonce);
    } catch(e) {
        res.send(xmlrpc.serializeFault(401, "nonce update failed"));
        return;
    }

    // reconstruct hash to match exchange
    let nonce = microtime().replace(/(0)\.(\d+) (\d+)/, '$3$1$2');
    let this15m = Math.floor(Date.now() / 60000);
    let hash = crypto.createHash('sha256').update(crypto.createHash('md5').update(process.env.SERVERPASS + this15m + process.env.HASHKEY + param_nonce).digest('hex')).digest('hex');

    if (hash!=param_hash){
        res.send(xmlrpc.serializeFault(401, "unauthorized"));
        return;
    }

    next();
}

module.exports = checkLogin;
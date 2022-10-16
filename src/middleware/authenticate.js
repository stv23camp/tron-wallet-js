require('dotenv').config();
const xmlrpc = require('express-xmlrpc');
const crypto = require('crypto');
const database = require('../library/db_sqlite');

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
    const now_unix = Math.floor(new Date().getTime() / 1000);
    const this15m = Math.floor(now_unix/60);

    var hashes = [0, 1, -1].map(function(x){
        const stitch = process.env.SERVERPASS + (this15m+x).toString() + process.env.HASHKEY + param_nonce;
        const hash = crypto.createHash('md5', stitch).digest('hex');
        return crypto.createHash('sha256', hash).digest('hex');
    });

    if (hashes.includes(param_hash)){
        res.send(xRpc.serializeFault(401, "unauthorized"));
        return;
    }

    next();
}

module.exports = checkLogin;
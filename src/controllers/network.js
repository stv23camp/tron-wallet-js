require('dotenv').config();
const xmlrpc = require('express-xmlrpc');
const tron = require('../library/tron');

async function getBlockCount(_req, res){
    try {
        const block = await tron.getBlockHeight();
        res.send(xmlrpc.serializeResponse({blocks: block}));
    } catch(e) {
        res.send(xmlrpc.serializeFault(500, e.message));
    }
}

module.exports = {
    getBlockCount: getBlockCount
};


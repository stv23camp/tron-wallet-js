/*------ DEPENDENCIES ------*/
require('dotenv').config();
const mysql = require('mysql2/promise');

/*------ CONFIG ------*/
const _config = {
    connectionLimit: 10,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DBDATABASE,
    debug: false
}

/*------ CORE FUNCTIONS ------*/

async function _getdb(){
    const pool = mysql.createPool(_config);
    const conn = await pool.getConnection();
    console.log('conn established ');
    return conn;
}

async function executeQuery(query){   
    const conn = await _getdb(); // err will bubble to sentry on top
    const result = await conn.query(query);
    console.log('query successful');
    conn.release();
    return result;
}

async function _insertRow(query){   
    await executeQuery(query);
}

async function _getRow(query){
    const result = await executeQuery(query);     
    return result[0]; 
}

async function _updateRow(query){
    await executeQuery(query);
}

/*------ CREATE TABLES ------*/

// payments
async function createTablePayments(){
    const query = "CREATE TABLE IF NOT EXISTS payments (id int NOT NULL AUTO_INCREMENT,asset_code varchar(255) NOT NULL,wd_address varchar(255) NOT NULL,amount varchar(255) NOT NULL,submit_time int NOT NULL,PRIMARY KEY (id)) ENGINE=InnoDB AUTO_INCREMENT=2020 DEFAULT CHARSET=latin1";
    await executeQuery(query);
}

// counter
async function createTableCounter(){
    const query = "CREATE TABLE IF NOT EXISTS `counter` (`last_update_time` int NOT NULL,`last_updated_block_num` varchar(255) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=latin1";
    await executeQuery(query);
}
// trc20_counter
async function createTableCounterTrc20(){
    const query = "CREATE TABLE IF NOT EXISTS `trc20_counter` (`last_update_time` int unsigned DEFAULT NULL,`last_updated_block_num` int DEFAULT NULL) ENGINE=InnoDB DEFAULT CHARSET=latin1";
    await executeQuery(query);
}

// addresses
async function createTableAddresses(){
    const query = "CREATE TABLE `addresses` (`id` int NOT NULL AUTO_INCREMENT,`created` int NOT NULL,`address` varchar(255) NOT NULL,`privatekey` varchar(255) NOT NULL,PRIMARY KEY (`id`),UNIQUE KEY `address` (`address`)) ENGINE=InnoDB AUTO_INCREMENT=2020 DEFAULT CHARSET=latin1";
    await executeQuery(query);
}

// TRC20_transactions
async function createTableTransactionsTrc20(){
    const query = "CREATE TABLE `TRC20_transactions` (`id` int NOT NULL AUTO_INCREMENT,`token` varchar(255) DEFAULT NULL,`txid` varchar(255) NOT NULL,`from` varchar(255) NOT NULL,`to` varchar(255) NOT NULL,`amount` decimal(30,8) DEFAULT NULL,`submitted_time` int NOT NULL,`block` int DEFAULT NULL,PRIMARY KEY (`id`)) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1";
    await executeQuery(query);
}
// transactions
async function createTableTransactions(){
    const query = "CREATE TABLE `transactions` (`id` int NOT NULL AUTO_INCREMENT,`txid` varchar(255) NOT NULL,`from` varchar(255) NOT NULL,`to` varchar(255) NOT NULL,`amount` decimal(30,8) DEFAULT NULL,`submitted_time` int NOT NULL,`block` int DEFAULT NULL,PRIMARY KEY (`id`),UNIQUE KEY `txid` (`txid`)) ENGINE=InnoDB AUTO_INCREMENT=4220 DEFAULT CHARSET=latin1";
    await executeQuery(query);
}

/*------ ADDRESSES ------*/

async function getAddresses(){
    const query = 'SELECT address from addresses';
    const result = await _getRow(query);

    const addresses = result.map((item)=>{
        return item.address;
    });
    return addresses;
}

async function insertAddress(addr, pk){
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const query = `INSERT INTO addresses (created, address, privatekey) VALUES (${timestamp}, '${addr}', '${pk}')`;
    await _insertRow(query);
}

async function isAddressExist(addr){
    const query = `SELECT address from addresses where address='${addr}'`;
    const result = await _getRow(query);
    if (result.length>0) return true;
    return false;
}

/*------ COUNTER, TRC20_COUNTER ------*/

async function getLastBlockTrc20(){
    const query = 'SELECT last_updated_block_num FROM trc20_counter';

    const rows = await _getRow(query);
    return rows[0].last_updated_block_num;
}

async function getLastBlock(){
    const query = 'SELECT last_updated_block_num FROM counter';

    const rows = await _getRow(query);
    return rows[0].last_updated_block_num;
}

async function insertCounter(block){
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const query = `INSERT INTO counter (last_update_time, last_updated_block_num) values (${timestamp}, '${block}');`
    await _insertRow(query);
}

async function insertCounterTrc20(block){
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const query = `INSERT INTO trc20_counter (last_update_time, last_updated_block_num) values (${timestamp}, '${block}');`
    await _insertRow(query);
}

async function updateCounter(blockno){
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const query = `UPDATE counter SET last_update_time=${timestamp}, last_updated_block_num='${blockno}'`;
    await _updateRow(query);
}

async function updateCounterTrc20(blockno){
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const query = `UPDATE trc20_counter SET last_update_time=${timestamp}, last_updated_block_num='${blockno}'`;
    await _updateRow(query);
}

/*------ TRANSACTIONS ------*/

async function getPrivate(address){
    const query = `SELECT privatekey FROM addresses WHERE address = '${address}'`;

    const rows = await _getRow(query);
    return rows[0].privatekey;
}

async function getTransactionsNative(){
    const query = "SELECT `txid`, `from`, `to`, `amount`, `block` FROM transactions ORDER BY id DESC LIMIT 100";
    const result = await _getRow(query);
    return result;
}

async function getTransactionsTrc20(){
    const query = "SELECT `txid`, `from`, `to`, `amount`, `block` FROM TRC20_transactions ORDER BY id DESC LIMIT 100";
    const result = await _getRow(query);
    return result;
}

async function insertTransactionNative(txid_, from_, to_, amount_, block_){
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const query = `INSERT INTO transactions (txid, \`from\`,\`to\`,amount,submitted_time,block) VALUES ('${txid_}', '${from_}', '${to_}', ${amount_}, ${timestamp}, ${block_})`;
    await _insertRow(query);
}

async function insertTransactionTrc20(token_, txid_, from_, to_, amount_, block_){
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const query = `INSERT INTO TRC20_transactions (token, txid, \`from\`,\`to\`,amount,submitted_time,block) VALUES ('${token_}', '${txid_}', '${from_}', '${to_}', ${amount_}, ${timestamp}, ${block_})`;
    await _insertRow(query);
}

/*------ PAYMENTS ------*/

async function getPayments(){
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const sixhours_ago = timestamp - (6 * 60 * 60);
    const query = `SELECT * FROM payments WHERE submit_time>${sixhours_ago}`;
    const result = await _getRow(query);
    return result;
}

async function insertPayment(asset_code, wd_address, amount){
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const query = `INSERT INTO payments (asset_code, wd_address, amount, submit_time) VALUES ('${asset_code}', '${wd_address}', '${amount}', ${timestamp})`;
    await _insertRow(query);
}

module.exports = {    
    executeQuery: executeQuery,
    // create tables,
    createTableCounter: createTableCounter,
    createTableCounterTrc20: createTableCounterTrc20,
    createTableAddresses: createTableAddresses,
    createTableTransactionsTrc20: createTableTransactionsTrc20,
    createTableTransactions: createTableTransactions,
    createTablePayments: createTablePayments,
    // counter, trc20_counter 
    getLastBlock: getLastBlock,
    getLastBlockTrc20: getLastBlockTrc20,
    updateCounter: updateCounter,
    updateCounterTrc20: updateCounterTrc20,
    insertCounter: insertCounter,
    insertCounterTrc20: insertCounterTrc20,
    // addresses
    getAddresses: getAddresses,
    insertAddress: insertAddress,
    getPrivate: getPrivate,
    isAddressExist: isAddressExist,
    // transactions 
    getTransactionsNative: getTransactionsNative,
    insertTransactionNative: insertTransactionNative,
    getTransactionsTrc20: getTransactionsTrc20,
    insertTransactionTrc20: insertTransactionTrc20,  
    // payments 
    insertPayment: insertPayment,
    getPayments: getPayments
} 
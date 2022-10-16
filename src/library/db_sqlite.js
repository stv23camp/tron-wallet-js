/*------ DEPENDENCIES ------*/

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

/*------ NONCE RELATED ------*/
let _db_nonce;
const nonce_file = process.env.NONCEFILE;

function initNonceDb() {
    _db_nonce = new sqlite3.Database(nonce_file);
}

async function getNonce() {
    if (!_db_nonce) {
        console.log("Nonce DB has not been initialized...");
        return;
    }

    const sql = "SELECT * FROM nonce";

    return new Promise((resolve, reject) => {
        _db_nonce.all(sql, (err, rows) => {
            if (err) reject(err);
            resolve(rows[0].nonce);
        });
    });
}

async function updateNonce(oldNonce, newNonce) {

    if (!_db_nonce) {
        console.log("Nonce DB has not been initialized...");
        return;
    }

    const sql = "UPDATE nonce SET nonce = ? WHERE nonce = ?";

    return new Promise((resolve, reject)=>{
        _db_nonce.run(sql, [newNonce, oldNonce], (err, data)=>{
            if (err){
                reject(err); // bubble to sentry
            }

            resolve(data);
        });
    });
}

async function createNonceTable(){
    if (!_db_nonce) {
        console.log("Nonce DB has not been initialized...");
        return;
    }
    const sql = "CREATE TABLE IF NOT EXISTS nonce(nonce varchar(30))";

    return new Promise((resolve, reject)=>{
        _db_nonce.run(sql, (err, data)=>{
            if (err){
                console.log(err);
                reject(err)
            }
            resolve(data);
        }); 
    });
    
}

async function countRowNonce(){
    if (!_db_nonce) {
        console.log("Nonce DB has not been initialized...");
        return;
    }

    const sql = "SELECT COUNT(*) FROM nonce";

    return new Promise((resolve, reject)=>{
        _db_nonce.all(sql, (err, result)=>{
            if(err){
                reject(err);              
            }
            resolve(result[0]['COUNT(*)']);
        });
    });
}

async function populateNonce() {
    if (!_db_nonce) {
        console.log("Nonce DB has not been initialized...");
        return;
    }

    const sql = "INSERT INTO nonce (nonce) VALUES (?)";   

    return new Promise((resolve, reject)=>{
        _db_nonce.run(sql, ['1663159949040822800'], (err, data)=>{
            if (err){
                console.log(err);
                reject(err)
            }
            resolve(data);
        }); 
    });
}

module.exports = {  
    initNonceDb: initNonceDb,
    getNonce: getNonce,
    updateNonce: updateNonce,
    createNonceTable: createNonceTable,
    countRowNonce: countRowNonce,
    populateNonce: populateNonce
}
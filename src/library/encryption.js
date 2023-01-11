require('dotenv').config();
const crypto = require('crypto');

const secret_decrypt = crypto.createHash('sha256')
    .update(process.env.DECRYPTION, 'utf-8')
    .digest('hex').substring(0, 32);

const secret_encrypt = crypto.createHash('sha256')
    .update(process.env.ENCRYPTION, 'utf-8')
    .digest('hex').substring(0, 32);

const iv = crypto.createHash('sha256')
    .update(process.env.IV, 'utf-8')
    .digest('hex').substring(0, 16);

function decryptKey(key){    
    const buff = Buffer.from(key, 'base64');
    const encryptedmessage = buff.toString('utf-8');
    const decryptor = crypto.createDecipheriv(process.env.METHOD, secret_decrypt, iv);
    return decryptor.update(encryptedmessage, 'base64', 'utf-8') + decryptor.final('utf-8');    
}

function encryptKey(naked_secret){
    const encryptor = crypto.createCipheriv(process.env.METHOD, secret_encrypt, iv);
    const aes_encrypted = encryptor.update(naked_secret, 'utf-8', 'base64') + encryptor.final('base64');
    const encryptedkey = Buffer.from(aes_encrypted).toString('base64');
    return encryptedkey;
}

module.exports = {
    decryptKey: decryptKey,
    encryptKey: encryptKey
} 
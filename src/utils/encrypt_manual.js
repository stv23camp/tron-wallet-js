const encryption = require('../library/encryption');

const target = '';
const encrypted = encryption.encryptKey(target);
console.log(encrypted);
const encryption = require('./src/library/encryption');
const tron = require('./src/library/tron');
(
    async () => {
        const raw = await tron.createAddress(); 
        const address = raw.address.base58;
        console.log('public: ', address);
        console.log('raw_pk: ', raw.privateKey);

        const encrypted = encryption.encryptKey(raw.privateKey);
        console.log('encrypted_pk: ', encrypted);
    }
)();
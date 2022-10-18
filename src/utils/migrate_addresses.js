require('dotenv').config();
const encryption = require('../library/encryption');
const db = require('../library/db_mysql');

async function getMigratedAddresses(){
    const q = 'SELECT address, privatekey FROM addresses_migrate';
    const result = await db.executeQuery(q);

    for (let item of result[0]){
        const isExist = await db.isAddressExist(item.address);
        if (isExist) {
            console.log('address found, skipping...')
            continue;
        }
        const encrypted = encryption.encryptKey(item.privatekey);
        // insert here
        await db.insertAddress(item.address, encrypted);
    }
}

(
    async () => {
        await getMigratedAddresses();
     
    }
)();

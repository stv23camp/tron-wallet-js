const db = require('../library/db_sqlite');

async function nonceInit(){
    db.initNonceDb();
    await db.createNonceTable(); // create table nonce if not exists
    const counts = await db.countRowNonce(); // check if table nonce has record
    if (counts==0){
        await db.populateNonce(); // populate nonce with initial record
    }
    console.log('nonce DB connected...');
}

module.exports = {
    nonceInit: nonceInit
}
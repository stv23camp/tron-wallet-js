require('dotenv').config();
/*------ MYSQL CONFIG & IMPORTS ------*/
const mysql = require('mysql2/promise');
const db = {
    connectionLimit: 10,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DBDATABASE,
    debug: false
}

const pool = mysql.createPool(db);

module.exports = pool;


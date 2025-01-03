require("dotenv").config();
const mysql = require("mysql2/promise");
    //Create connection
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB,
        port: process.env.DB_PORT
    });

    module.exports = pool;
           
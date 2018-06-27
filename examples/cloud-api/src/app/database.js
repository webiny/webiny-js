import mysql from "mysql";

let config = {
    host: "localhost",
    port: 32768,
    user: "root",
    password: "dev",
    database: "webiny-cloud",
    timezone: "Z",
    connectionLimit: 100
};

const connection = mysql.createPool(config);

export { connection };

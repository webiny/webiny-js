import mysql from "mysql";

const connection = mysql.createPool({
    host: "localhost",
    port: 32768,
    user: "root",
    password: "dev",
    database: "webiny",
    timezone: "Z",
    connectionLimit: 100
});

export { connection };

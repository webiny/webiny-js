import mysql from "mysql";

const pool = mysql.createPool({
    host: "localhost",
    port: 32768,
    user: "root",
    password: "dev",
    database: "webiny",
    timezone: "Z"
});

const sqlConnection = {
    mySQL: pool
};

const entityConnection = { connection: pool };

export { sqlConnection, entityConnection };

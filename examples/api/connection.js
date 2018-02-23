import mysql from "mysql";

export default mysql.createPool({
    connection: {
        host: "localhost",
        port: 32768,
        user: "root",
        password: "dev",
        database: "webiny"
    }
});

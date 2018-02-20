import { Table } from "webiny-sql-table";
import { MySQLDriver } from "./../..";

class MySQLTable extends Table {}

MySQLTable.setEngine("InnoDB")
    .setDefaultCharset("utf8")
    .setCollate("utf8_bin");

MySQLTable.setDriver(
    new MySQLDriver({
        connection: {
            host: "localhost",
            user: "root",
            password: "dev",
            database: "test1"
        }
    })
);

export default MySQLTable;

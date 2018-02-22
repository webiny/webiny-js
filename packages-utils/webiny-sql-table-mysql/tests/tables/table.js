import { Table } from "webiny-sql-table";
import { MySQLDriver } from "./../..";
import mysql from "mysql";

class MySQLTable extends Table {}

MySQLTable.setEngine("InnoDB")
    .setDefaultCharset("utf8")
    .setCollate("utf8_bin")
    .setAutoIncrement(1000)
    .setDriver(
        new MySQLDriver({
            connection: mysql.createConnection({})
        })
    );

export default MySQLTable;

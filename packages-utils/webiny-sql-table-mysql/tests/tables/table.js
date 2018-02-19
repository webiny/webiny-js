import { Table } from "webiny-sql-table";
import { MySQLDriver } from "./../..";

class MySQLTable extends Table {}

MySQLTable.setEngine("InnoDB")
    .setDefaultCharset("utf8")
    .setCollate("collate");

MySQLTable.setDriver(new MySQLDriver());

export default MySQLTable;

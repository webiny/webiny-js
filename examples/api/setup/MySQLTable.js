import { Table } from "webiny-sql-table";
import { MySQLDriver } from "webiny-sql-table-mysql";
import connection from "./../connection";

class MySQLTable extends Table {
    constructor() {
        super();
        this.column("id")
            .bigInt(20)
            .setUnsigned()
            .setAutoIncrement()
            .setNotNull();

        this.column("createdOn").dateTime();
        this.column("savedOn").dateTime();
        this.column("updatedOn").dateTime();
        this.column("deleted")
            .smallInt()
            .setDefault(0);

        this.index().primary("id");
    }
}

MySQLTable.setEngine("InnoDB")
    .setDefaultCharset("utf8")
    .setCollate("utf8_bin");

MySQLTable.setDriver(new MySQLDriver(connection));

export default MySQLTable;

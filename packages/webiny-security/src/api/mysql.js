// @flow
import { MySQLDriver } from "webiny-sql-table-mysql";
import { Table } from "webiny-sql-table";

class MySQLTable extends Table {
    constructor() {
        super();

        this.column("id").char(24);
        this.index().primary("id");

        this.column("createdOn").dateTime();
        this.column("savedOn").dateTime();
        this.column("updatedOn").dateTime();

        this.column("deleted")
            .tinyInt(1)
            .setDefault(0);
    }
}

MySQLTable.setEngine("InnoDB")
    .setDefaultCharset("utf8mb4")
    .setCollate("utf8mb4_general_ci");

MySQLTable.setDriver(new MySQLDriver());

export default MySQLTable;

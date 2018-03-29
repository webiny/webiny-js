// @flow
import { Table } from "webiny-sql-table";
import { MySQLDriver } from "webiny-sql-table-mysql";

class MySQLTable extends Table {
    constructor() {
        super();
        this.column("id").char(24);

        this.column("createdOn").dateTime();
        this.column("createdBy").char(24);
        this.column("createdByClassId").varChar(100);

        this.column("savedOn").dateTime();
        this.column("savedBy").char(24);
        this.column("savedByClassId").varChar(100);

        this.column("updatedOn").dateTime();
        this.column("updatedBy").char(24);
        this.column("updatedByClassId").varChar(100);

        this.column("deleted")
            .tinyInt(1)
            .setDefault(0);

        this.index().primary("id");
    }
}

MySQLTable.setEngine("InnoDB")
    .setDefaultCharset("utf8")
    .setCollate("utf8_general_ci");

MySQLTable.setDriver(new MySQLDriver());

export default MySQLTable;

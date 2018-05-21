// @flow
import MySQLTable from "./mysqlTable";

class IdentityTable extends MySQLTable {
    constructor() {
        super();
        this.column("lastActive").date();
        this.column("lastLogin").date();
    }
}

export default IdentityTable;

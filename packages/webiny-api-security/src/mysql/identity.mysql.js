// @flow
import { MySQLTable } from "webiny-api";

class IdentityTable extends MySQLTable {
    constructor() {
        super();
        this.column("lastActive").date();
        this.column("lastLogin").date();
        this.column("groups").json();
    }
}

export default IdentityTable;

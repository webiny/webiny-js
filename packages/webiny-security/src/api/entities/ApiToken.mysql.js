// @flow
import { MySQLTable } from "webiny-api";

class ApiTokenTable extends MySQLTable {
    constructor() {
        super();
        this.column("createdBy").char(24);
        this.column("name").char(50);
        this.column("token").text();
        this.column("description").varChar(255);
    }
}

ApiTokenTable.setName("Security_ApiTokens");

export default ApiTokenTable;

// @flow
import IdentityTable from "./identity.mysql";

class ApiTokenTable extends IdentityTable {
    constructor() {
        super();
        this.column("name").char(50);
        this.column("token").text();
        this.column("description").varChar(255);
    }
}

ApiTokenTable.setName("Security_ApiTokens");

export default ApiTokenTable;

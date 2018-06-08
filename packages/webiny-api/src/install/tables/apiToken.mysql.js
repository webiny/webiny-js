// @flow
import IdentityTable from "./identity.mysql";

class ApiTokenTable extends IdentityTable {
    constructor() {
        super();
        this.column("name").char(50);
        this.column("token").char(100);

        this.column("description").varChar(255);

        this.column("enabled")
            .smallInt(1)
            .setDefault(1);

        this.index().unique("token");
    }
}

ApiTokenTable.setName("Security_ApiTokens");

export default ApiTokenTable;

// @flow
import { MySQLTable } from "webiny-api";

class UserTable extends MySQLTable {
    constructor() {
        super();
        this.column("email")
            .char(50)
            .setNotNull();
        this.column("password")
            .char(60)
            .setNotNull();
        this.column("firstName").char(20);
        this.column("lastName").char(20);
        this.column("enabled")
            .smallInt(1)
            .setDefault(1);

        this.column("avatar").text();

        this.index().unique("email", "deleted", "savedOn");
    }
}

UserTable.setName("Security_Users");

export default UserTable;

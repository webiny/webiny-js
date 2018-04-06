import { MySQLTable } from "webiny-api";

class Identity2RoleTable extends MySQLTable {
    constructor() {
        super();
        this.column("identity")
            .varChar(50)
            .setNotNull();
        this.column("identityClassId")
            .varChar(50)
            .setNotNull();
        this.column("role")
            .char(24)
            .setNotNull();

        this.index().key("identity", "role", "deleted");
    }
}

Identity2RoleTable.setName("Security_Identity2Role");

export default Identity2RoleTable;

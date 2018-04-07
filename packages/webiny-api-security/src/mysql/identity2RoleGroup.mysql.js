import { MySQLTable } from "webiny-api";

class Identity2RoleGroupTable extends MySQLTable {
    constructor() {
        super();
        this.column("identity")
            .varChar(50)
            .setNotNull();
        this.column("identityClassId")
            .varChar(50)
            .setNotNull();
        this.column("roleGroup")
            .char(24)
            .setNotNull();

        this.index().key("identity", "roleGroup", "deleted");
    }
}

Identity2RoleGroupTable.setName("Security_Identity2RoleGroup");

export default Identity2RoleGroupTable;

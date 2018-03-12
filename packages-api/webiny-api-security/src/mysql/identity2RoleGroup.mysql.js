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
            .bigInt(20)
            .setUnsigned()
            .setNotNull();

        this.index("unique").unique("identity", "roleGroup");
    }
}

Identity2RoleGroupTable.setName("Security_Identity2RoleGroup");

export default Identity2RoleGroupTable;

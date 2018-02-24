import MySQLTable from "./../MySQLTable";

class Role2RoleGroup extends MySQLTable {
    constructor() {
        super();
        this.column("role")
            .bigInt(20)
            .setUnsigned()
            .setNotNull();
        this.column("roleGroup")
            .bigInt(20)
            .setUnsigned()
            .setNotNull();

        this.index("unique").unique("roleGroup", "role");
    }
}

Role2RoleGroup.setName("Security_Role2RoleGroup");

export default Role2RoleGroup;

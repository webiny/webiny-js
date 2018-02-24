import MySQLTable from "./../MySQLTable";

class Role2Permission extends MySQLTable {
    constructor() {
        super();
        this.column("role")
            .bigInt(20)
            .setUnsigned()
            .setNotNull();
        this.column("permission")
            .bigInt(20)
            .setUnsigned()
            .setNotNull();

        this.index("unique").unique("permission", "role");
    }
}

Role2Permission.setName("Security_Role2Permission");

export default Role2Permission;

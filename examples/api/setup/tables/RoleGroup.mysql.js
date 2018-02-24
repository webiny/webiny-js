import MySQLTable from "./../MySQLTable";

class RoleGroup extends MySQLTable {
    constructor() {
        super();
        this.column("name")
            .varChar(50)
            .setNotNull();
        this.column("slug")
            .varChar(50)
            .setNotNull();
    }
}

RoleGroup.setName("Security_RoleGroups");

export default RoleGroup;

import MySQLTable from "./../MySQLTable";

class Role extends MySQLTable {
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

Role.setName("Security.Roles");

export default Role;

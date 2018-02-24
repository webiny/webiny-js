// @flow
import MySQLTable from "./../MySQLTable";

class UserTable extends MySQLTable {
    constructor() {
        super();
        this.column("email")
            .char(20)
            .setNotNull();
        this.column("password")
            .char(60)
            .setNotNull();
        this.column("firstName").char(20);
        this.column("lastName").char(20);
        this.column("enabled")
            .smallInt(1)
            .setDefault(1);
        this.column("lastActive").date();
        this.column("lastLogin").date();

        this.index().unique("email");
    }
}

UserTable.setName("Users");

export default UserTable;

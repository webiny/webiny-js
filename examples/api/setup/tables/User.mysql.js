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

        this.index("email").unique();
    }
}

UserTable.setName("Users");

export default UserTable;

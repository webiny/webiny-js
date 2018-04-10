import { MySQLTable } from "webiny-api";

class Permission extends MySQLTable {
    constructor() {
        super();
        this.column("name")
            .varChar(50)
            .setNotNull();
        this.column("slug")
            .varChar(50)
            .setNotNull();
        this.column("description")
            .varChar(200)
            .setNotNull();
        this.column("fields").json();
    }
}

Permission.setName("Security_Permissions");

export default Permission;

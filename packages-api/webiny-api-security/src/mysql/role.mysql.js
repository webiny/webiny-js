import { MySQLTable } from "webiny-api";

class Role extends MySQLTable {
    constructor() {
        super();
        this.column("name")
            .varChar(50)
            .setNotNull();
        this.column("description")
            .varChar(200)
            .setNotNull();
        this.column("slug")
            .varChar(50)
            .setNotNull();
    }
}

Role.setName("Security_Roles");

export default Role;

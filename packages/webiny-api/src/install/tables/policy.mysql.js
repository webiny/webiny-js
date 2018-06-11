import MySQLTable from "./mysqlTable";

class Policy extends MySQLTable {
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
        this.column("permissions").json();
    }
}

Policy.setName("Security_Policies");

export default Policy;

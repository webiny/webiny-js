import { MySQLTable } from "./../..";

class Group extends MySQLTable {
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

Group.setName("Security_Groups");

export default Group;

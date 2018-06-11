import MySQLTable from "./mysqlTable";

class Entities2Groups extends MySQLTable {
    constructor() {
        super();
        this.column("entity").char(24);
        this.column("entityClassId").varChar(100);
        this.column("group").char(24);

        this.index("entity");
        this.index("group");
    }
}

Entities2Groups.setName("Security_Groups2Entities");

export default Entities2Groups;

// @flow
import MySQLTable from "../install/tables/mysqlTable";

class Groups2Entities extends MySQLTable {
    constructor() {
        super();
        this.column("entity").char(24);
        this.column("entityClassId").varChar(100);
        this.column("group").char(24);

        this.index("entity");
        this.index("group");
    }
}

Groups2Entities.setName("Security_Groups2Entities");

export default Groups2Entities;
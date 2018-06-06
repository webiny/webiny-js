import MySQLTable from "./mysqlTable";

class Entities2Policies extends MySQLTable {
    constructor() {
        super();
        this.column("entity").char(24);
        this.column("entityClassId").varChar(100);
        this.column("policy").char(24);

        this.index("entity");
        this.index("policy");
    }
}

Entities2Policies.setName("Entities2SecurityPolicies");

export default Entities2Policies;

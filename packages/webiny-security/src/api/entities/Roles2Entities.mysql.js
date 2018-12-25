// @flow
import { MySQLTable } from "webiny-api";

class Roles2Entities extends MySQLTable {
    constructor() {
        super();
        this.column("entity").char(24);
        this.column("entityClassId").varChar(100);
        this.column("role").char(24);

        this.index("entity");
        this.index("role");
    }
}

Roles2Entities.setName("Security_Roles2Entities");

export default Roles2Entities;

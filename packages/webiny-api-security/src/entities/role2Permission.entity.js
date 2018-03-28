import { Entity } from "webiny-api";
import Role from "./role.entity";
import Permission from "./permission.entity";

export class Role2Permission extends Entity {
    constructor() {
        super();
        this.attr("role").entity(Role);
        this.attr("permission").entity(Permission);
    }
}

Role2Permission.classId = "Security.Role2Permission";
Role2Permission.tableName = "Security_Role2Permission";

export default Role2Permission;

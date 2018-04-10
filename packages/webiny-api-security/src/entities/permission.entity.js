import { Entity } from "webiny-api";
import Role from "./role.entity";
import Role2Permission from "./role2Permission.entity";
import nameSlugDesc from "./helpers/nameSlugDesc";

class Permission extends Entity {
    constructor() {
        super();
        nameSlugDesc(this);
        this.attr("fields").array();
        this.attr("roles")
            .entities(Role)
            .setUsing(Role2Permission);
    }
}

Permission.classId = "SecurityPermission";
Permission.tableName = "Security_Permissions";

export default Permission;

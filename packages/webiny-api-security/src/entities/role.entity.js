import { Entity } from "webiny-api";
import Permission from "./permission.entity";
import RoleGroup from "./roleGroup.entity";
import Role2Permission from "./role2Permission.entity";
import Role2RoleGroup from "./role2RoleGroup.entity";
import nameSlugDesc from "./helpers/nameSlugDesc";

class Role extends Entity {
    constructor() {
        super();
        nameSlugDesc(this);
        this.attr("permissions")
            .entities(Permission)
            .setUsing(Role2Permission);

        this.attr("roleGroups")
            .entities(RoleGroup)
            .setUsing(Role2RoleGroup);
    }
}

Role.classId = "SecurityRole";
Role.tableName = "Security_Roles";

export default Role;

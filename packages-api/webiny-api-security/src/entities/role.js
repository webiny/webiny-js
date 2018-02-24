import { Entity } from "webiny-api";
import Permission from "./permission";
import RoleGroup from "./roleGroup";
import Role2Permission from "./role2Permission";
import Role2RoleGroup from "./role2RoleGroup";
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

Role.classId = "Security.Role";

export default Role;

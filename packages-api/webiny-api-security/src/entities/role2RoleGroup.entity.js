// @flow
import { Entity } from "webiny-api";
import Role from "./role.entity";
import RoleGroup from "./roleGroup.entity";

class Role2RoleGroup extends Entity {
    constructor() {
        super();
        this.attr("role").entity(Role);
        this.attr("roleGroup").entity(RoleGroup);
    }
}

Role2RoleGroup.classId = "Security.Role2RoleGroup";
Role2RoleGroup.tableName = "Security_Role2RoleGroup";

export default Role2RoleGroup;

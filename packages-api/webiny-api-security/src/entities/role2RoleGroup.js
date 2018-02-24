// @flow
import { Entity } from "webiny-api";
import Role from "./role";
import RoleGroup from "./roleGroup";

class Role2RoleGroup extends Entity {
    constructor() {
        super();
        this.attr("role").entity(Role);
        this.attr("roleGroup").entity(RoleGroup);
    }
}

Role2RoleGroup.classId = "Security.Role2RoleGroup";

export default Role2RoleGroup;

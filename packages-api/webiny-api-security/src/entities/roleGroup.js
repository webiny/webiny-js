import { Entity } from "webiny-api";
import Role from "./role";
import Role2RoleGroup from "./role2RoleGroup";
import nameSlugDesc from "./helpers/nameSlugDesc";

class RoleGroup extends Entity {
    constructor() {
        super();
        nameSlugDesc(this);
        this.attr("roles")
            .entities(Role)
            .setUsing(Role2RoleGroup);
    }
}

RoleGroup.classId = "Security.RoleGroup";

export default RoleGroup;

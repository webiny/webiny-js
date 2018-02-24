import { Entity } from "webiny-api";
import RoleGroup from "./roleGroup";

class Identity2RoleGroup extends Entity {
    constructor() {
        super();
        this.attr("identity").identity();
        this.attr("roleGroup").entity(RoleGroup);
    }
}

Identity2RoleGroup.classId = "Security.Identity2RoleGroup";

export default Identity2RoleGroup;

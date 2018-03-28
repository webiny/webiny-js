import { Entity } from "webiny-api";
import RoleGroup from "./roleGroup.entity";

class Identity2RoleGroup extends Entity {
    constructor() {
        super();
        this.attr("identity").identity({ classIdAttribute: "identityClassId" });
        this.attr("identityClassId").char();
        this.attr("roleGroup").entity(RoleGroup);
    }
}

Identity2RoleGroup.classId = "Security.Identity2RoleGroup";
Identity2RoleGroup.tableName = "Security_Identity2RoleGroup";

export default Identity2RoleGroup;

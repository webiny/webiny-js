import { Entity } from "webiny-api";
import Role from "./role.entity";

export class Identity2Role extends Entity {
    constructor() {
        super();
        this.attr("identity").identity({ classIdAttribute: "identityClassId" });
        this.attr("identityClassId").char();

        this.attr("role").entity(Role);
    }
}

Identity2Role.classId = "SecurityIdentity2Role";
Identity2Role.tableName = "Security_Identity2Role";

export default Identity2Role;

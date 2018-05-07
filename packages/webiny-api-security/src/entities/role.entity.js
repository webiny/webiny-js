import { Entity } from "webiny-api";
import nameSlugDesc from "./helpers/nameSlugDesc";

class Role extends Entity {
    constructor() {
        super();
        nameSlugDesc(this);
    }
}

Role.classId = "SecurityRole";
Role.tableName = "Security_Roles";

export default Role;

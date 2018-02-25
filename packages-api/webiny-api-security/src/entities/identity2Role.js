import { Entity } from "webiny-api";
import Role from "./role";

export class Identity2Role extends Entity {
    constructor() {
        super();
        this.attr("identity").identity();
        this.attr("role").entity(Role);
    }
}

Identity2Role.classId = "Security.Identity2Role";
Identity2Role.tableName = "Security_Identity2Role";

export default Identity2Role;

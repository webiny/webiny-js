import { Entity } from "webiny-api";
import Role from "./role";
import Permission from "./permission";

export class Role2Permission extends Entity {
    constructor() {
        super();
        this.attr("role").entity(Role);
        this.attr("permission").entity(Permission);
    }
}

Role2Permission.classId = "Security.Role2Permission";

export default Role2Permission;

// @flow
import { EntityEndpoint } from "webiny-api";
import { Role } from "./../";

class Roles extends EntityEndpoint {
    getEntityClass() {
        return Role;
    }
}

Roles.classId = "Security.Roles";
Roles.version = "1.0.0";

export default Roles;

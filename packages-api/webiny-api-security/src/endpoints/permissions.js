// @flow
import { EntityEndpoint } from "webiny-api";
import { Permission } from "./../";

class Permissions extends EntityEndpoint {
    getEntityClass() {
        return Permission;
    }
}

Permissions.classId = "Security.Permissions";
Permissions.version = "1.0.0";

export default Permissions;

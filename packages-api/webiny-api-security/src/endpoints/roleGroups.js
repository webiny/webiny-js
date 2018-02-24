// @flow
import { EntityEndpoint } from "webiny-api";
import { RoleGroup } from "./../";

class RoleGroups extends EntityEndpoint {
    getEntityClass() {
        return RoleGroup;
    }
}

RoleGroups.classId = "Security.RoleGroups";
RoleGroups.version = "1.0.0";

export default RoleGroups;

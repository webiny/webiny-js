import { Entity } from "webiny-api";
import Role from "./role.entity";
import Role2RoleGroup from "./role2RoleGroup.entity";
import nameSlugDesc from "./helpers/nameSlugDesc";
import onSetFactory from "./helpers/onSetFactory";

class RoleGroup extends Entity {
    constructor() {
        super();
        nameSlugDesc(this);
        this.attr("roles")
            .entities(Role)
            .setUsing(Role2RoleGroup)
            .onGet(onSetFactory(Role));
    }
}

RoleGroup.classId = "Security.RoleGroup";
RoleGroup.tableName = "Security_RoleGroups";

export default RoleGroup;

import { Entity } from "webiny-entity";
import { Role } from "./Role.entity";

export class Roles2Entities extends Entity {
    entity: Entity;
    entityClassId: string;
    policy: Role;
}

Roles2Entities.classId = "SecurityRoles2Entities";
Roles2Entities.storageClassId = "Security_Roles2Entities";

export function roles2entitiesFactory({ entities }: Object) {
    return class extends Roles2Entities {
        constructor() {
            super();
            this.attr("entity").entity([], { classIdAttribute: "entityClassId" });
            this.attr("entityClassId").char();
            this.attr("role").entity(entities.Role);
        }
    };
}

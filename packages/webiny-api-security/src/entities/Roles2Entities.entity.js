// @flow
import { Entity } from "webiny-entity";
import type { IRole } from "./Role.entity";

export interface IRoles2Entities extends Entity {
    entity: Entity;
    entityClassId: string;
    role: IRole;
}

export function roles2entitiesFactory(context: Object): Class<IRoles2Entities> {
    return class Roles2Entities extends Entity {
        static classId = "SecurityRoles2Entities";

        entity: Entity;
        entityClassId: string;
        role: IRole;

        constructor() {
            super();

            const { getEntity } = context;

            this.attr("entity").entity([], { classIdAttribute: "entityClassId" });
            this.attr("entityClassId").char();
            this.attr("role").entity(getEntity("SecurityRole"));
        }
    };
}

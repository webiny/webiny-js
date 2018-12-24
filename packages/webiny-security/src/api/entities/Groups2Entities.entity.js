// @flow
import { Entity } from "webiny-entity";
import { Group } from "./Group.entity";

export class Groups2Entities extends Entity {
    entity: Entity;
    entityClassId: string;
    group: Group;
}

Groups2Entities.classId = "SecurityGroups2Entities";
Groups2Entities.storageClassId = "Security_Groups2Entities";

export function groups2entitiesFactory({ api: { entities } }: Object) {
    return class extends Groups2Entities {
        constructor() {
            super();
            this.attr("entity").entity([], { classIdAttribute: "entityClassId" });
            this.attr("entityClassId").char();
            this.attr("group").entity(entities.Group);
        }
    };
}

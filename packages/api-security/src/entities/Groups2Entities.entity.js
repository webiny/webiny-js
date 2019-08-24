// @flow
import { Entity } from "@webiny/entity";
import type { IGroup } from "./Group.entity";

export interface Groups2Entities extends Entity {
    entity: Entity;
    entityClassId: string;
    group: IGroup;
}

export function groups2entitiesFactory(context: Object) {
    return class Groups2Entities extends Entity {
        static classId = "SecurityGroups2Entities";

        constructor() {
            super();

            const { getEntity } = context;

            this.attr("entity").entity([], { classIdAttribute: "entityClassId" });
            this.attr("entityClassId").char();
            this.attr("group").entity(getEntity("SecurityGroup"));
        }
    };
}

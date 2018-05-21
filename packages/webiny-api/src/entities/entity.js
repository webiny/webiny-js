// @flow
import { app } from "webiny-api";
import { Entity as BaseEntity } from "webiny-entity";

import RequestEntityPool from "./RequestEntityPool";
class Entity extends BaseEntity {
    constructor() {
        super();
        app.entities.applyExtensions(this);

        this.attr("ownerClassId")
            .char()
            .setSkipOnPopulate();

        this.attr("owner")
            .identity({ classIdAttribute: "ownerClassId" })
            .setSkipOnPopulate();

        this.attr("groups")
            .entities(Group, "entity")
            .setUsing(Entities2Groups, "group");

        this.attr("savedByClassId")
            .char()
            .setSkipOnPopulate();

        this.attr("savedBy")
            .identity({ classIdAttribute: "savedByClassId" })
            .setSkipOnPopulate();

        // "createdBy" attribute - updated only on entity creation.
        this.attr("createdByClassId")
            .char()
            .setSkipOnPopulate();

        this.attr("createdBy")
            .identity({ classIdAttribute: "createdByClassId" })
            .setSkipOnPopulate();

        // "updatedBy" attribute - updated only on entity updates.
        this.attr("updatedByClassId")
            .char()
            .setSkipOnPopulate();

        this.attr("updatedBy")
            .identity({ classIdAttribute: "updatedByClassId" })
            .setSkipOnPopulate();
    }
}

Entity.crud = {
    logs: true,
    delete: {
        soft: true
    }
};

Entity.pool = new RequestEntityPool();

// We don't need a standalone "deletedBy" attribute, since its value would be the same as in "savedBy"
// and "updatedBy" attributes. Check these attributes to find out who deleted an entity.
Entity.on("save", async ({ entity }) => {
    if (!app.getRequest()) {
        return;
    }

    const { identity } = app.getRequest();
    entity.savedBy = identity;
    if (entity.isExisting()) {
        entity.updatedBy = identity;
    } else {
        entity.createdBy = identity;
    }
});

class Group extends Entity {
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("slug")
            .char()
            .setValidators("required");
        this.attr("description")
            .char()
            .setValidators("required");
        this.attr("permissions")
            .object()
            .setValidators()
            .setValue({ entities: {}, api: {} });

        this.on("delete", () => {
            if (this.slug === "default") {
                throw Error("Cannot delete default group.");
            }
        });
    }
}

Group.classId = "SecurityGroup";
Group.tableName = "Security_Groups";

Group.on("delete", async ({ entity }) => {
    const inUse = await Entities2Groups.count({ query: { group: entity.id } });
    if (inUse) {
        throw Error("Cannot delete group, already in use.");
    }
});

class Entities2Groups extends Entity {
    constructor() {
        super();
        this.attr("entity").entity([], { classIdAttribute: "entityClassId" });
        this.attr("entityClassId").char();
        this.attr("group").entity(Group);
    }
}

Entities2Groups.classId = "Entities2SecurityGroups";
Entities2Groups.tableName = "Entities2SecurityGroups";

export { Group, Entities2Groups, Entity };
export default Entity;

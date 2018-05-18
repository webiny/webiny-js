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
            .entities(Group)
            .setToStorage();

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

export { Group };
export default Entity;

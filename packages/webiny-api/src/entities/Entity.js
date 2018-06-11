// @flow
import { api } from "./..";
import { Entity as BaseEntity } from "webiny-entity";

import RequestEntityPool from "./RequestEntityPool";
class Entity extends BaseEntity {
    constructor() {
        super();
        api.entities.applyExtensions(this);

        this.attr("ownerClassId")
            .char()
            .setSkipOnPopulate();

        this.attr("owner")
            .identity({ classIdAttribute: "ownerClassId" })
            .setSkipOnPopulate();

        this.attr("groups")
            .entities(Group, "entity")
            .setUsing(Groups2Entities, "group");

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
    if (!api.getRequest()) {
        return;
    }

    const identity = api.services.get("security").getIdentity();

    entity.savedBy = identity;
    if (entity.isExisting()) {
        entity.updatedBy = identity;
    } else {
        entity.createdBy = identity;
    }
});

export { Entity };
export default Entity;

/**
 * ************************************************ Policy entities ************************************************
 */

class Policy extends Entity {
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
    }

    static async getDefaultPolicies() {
        const group = await Group.getDefaultGroup();
        return group.policies;
    }

    static async getDefaultPoliciesPermissions() {
        const defaultPermissions = { entities: {}, api: {} };

        const defaultPolicies = await Policy.getDefaultPolicies();
        for (let i = 0; i < defaultPolicies.length; i++) {
            const { entities, api } = defaultPolicies[i].permissions;

            for (let name in entities) {
                if (!defaultPermissions.entities[name]) {
                    defaultPermissions.entities[name] = [];
                }
                defaultPermissions.entities[name].push(entities[name]);
            }

            for (let name in api) {
                if (!defaultPermissions.api[name]) {
                    defaultPermissions.api[name] = [];
                }
                defaultPermissions.api[name].push(api[name]);
            }
        }

        return defaultPermissions;
    }
}

Policy.classId = "SecurityPolicy";
Policy.tableName = "Security_Policies";

Policy.on("delete", async ({ entity }) => {
    const inUse = await Policies2Entities.count({ query: { policy: entity.id } });
    if (inUse) {
        throw Error("Cannot delete policy, already in use.");
    }
});

class Policies2Entities extends Entity {
    constructor() {
        super();
        this.attr("entity").entity([], { classIdAttribute: "entityClassId" });
        this.attr("entityClassId").char();
        this.attr("policy").entity(Policy);
    }
}

Policies2Entities.classId = "SecurityPolicies2Entities";
Policies2Entities.tableName = "Security_Policies2Entities";

export { Policies2Entities, Policy };

/**
 * ************************************************ Groups entities ************************************************
 */
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

        this.attr("policies")
            .entities(Policy, "entity")
            .setUsing(Policies2Entities, "policy");

        this.on("delete", () => {
            if (this.slug === "default") {
                throw Error("Cannot delete default group.");
            }
        });
    }

    static async getDefaultGroup() {
        return Group.findOne({ query: { slug: "default" } });
    }
}

Group.classId = "SecurityGroup";
Group.tableName = "Security_Groups";

Group.on("delete", async ({ entity }) => {
    const inUse = await Groups2Entities.count({ query: { group: entity.id } });
    if (inUse) {
        throw Error("Cannot delete group, already in use.");
    }
});

class Groups2Entities extends Entity {
    constructor() {
        super();
        this.attr("entity").entity([], { classIdAttribute: "entityClassId" });
        this.attr("entityClassId").char();
        this.attr("group").entity(Group);
    }
}

Groups2Entities.classId = "SecurityGroups2Entities";
Groups2Entities.tableName = "Security_Groups2Entities";

export { Group, Groups2Entities };

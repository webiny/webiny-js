// @flow
import { Entity as BaseEntity } from "webiny-entity";
import { api } from "./../../index";
import type Identity from "../Identity/Identity.entity";
import RequestEntityPool from "./../RequestEntityPool";

class Entity extends BaseEntity {
    ownerClassId: string;
    owner: ?Identity;
    groups: Array<Group>;
    savedByClassId: ?string;
    savedBy: ?Identity;
    createdByClassId: ?string;
    createdBy: ?Identity;
    updatedByClassId: ?string;
    updatedBy: ?Identity;
    constructor() {
        super();

        this.attr("ownerClassId")
            .char()
            .setSkipOnPopulate();

        this.attr("owner")
            .identity({ classIdAttribute: "ownerClassId" })
            .setSkipOnPopulate();

        this.attr("groups")
            .entities(Group, "entity")
            .setUsing(Groups2Entities, "group");

        // "savedBy" attribute - updated only on entity creation.
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
    if (!api.getContext()) {
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

/**
 * ************************************************ Policy entities ************************************************
 */

class Policy extends Entity {
    name: string;
    slug: string;
    system: boolean;
    description: string;
    permissions: Object;
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("slug")
            .char()
            .setValidators("required")
            .setOnce();
        this.attr("description")
            .char()
            .setValidators("required");

        this.attr("system")
            .boolean()
            .onSet(value => (this.id ? this.system : value))
            .setValue(false);

        this.attr("permissions")
            .object()
            .setValidators()
            .setValue({ entities: {}, api: {} });

        this.on("delete", async () => {
            if (this.system) {
                throw Error("Cannot delete system policy.");
            }

            const inUse = await Policies2Entities.count({ query: { policy: this.id } });
            if (inUse) {
                throw Error("Cannot delete policy, already in use.");
            }
        });

        this.on("beforeCreate", async () => {
            const existingPolicy = await Policy.findOne({ query: { slug: this.slug } });
            if (existingPolicy) {
                throw Error(`Policy with slug "${this.slug}" already exists.`);
            }
        });

        // Let's just make sure security is up-to-date with all of the default policies.
        this.on("afterSave", async () => {
            api.services
                .get("security")
                .setDefaultPermissions(await Policy.getDefaultPoliciesPermissions());
        });
    }

    /**
     * Returns true if policy is assigned to a default group.
     */
    async isDefault(): Promise<boolean> {
        const defaultGroup = await Group.getDefaultGroup();
        return (
            (await Policies2Entities.count({
                query: { entity: defaultGroup.id, policy: this.id }
            })) > 0
        );
    }

    static async getDefaultPolicies() {
        const group = await Group.getDefaultGroup();
        return group.policies;
    }

    static async getDefaultPoliciesPermissions() {
        const defaultPolicies = await Policy.getDefaultPolicies();
        const output = [];
        defaultPolicies.forEach(policy => {
            output.push(policy.permissions);
        });
        return output;
    }
}

Policy.classId = "SecurityPolicy";
Policy.storageClassId = "Security_Policies";

class Policies2Entities extends Entity {
    entity: Entity;
    entityClassId: string;
    policy: Policy;
    constructor() {
        super();
        this.attr("entity").entity([], { classIdAttribute: "entityClassId" });
        this.attr("entityClassId").char();
        this.attr("policy").entity(Policy);
    }
}

Policies2Entities.classId = "SecurityPolicies2Entities";
Policies2Entities.storageClassId = "Security_Policies2Entities";

export { Policies2Entities, Policy };

/**
 * ************************************************ Groups entities ************************************************
 */
class Group extends Entity {
    name: string;
    slug: string;
    description: string;
    system: boolean;
    policies: Array<Policy>;
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("slug")
            .char()
            .setValidators("required")
            .setOnce();

        this.attr("description").char();
        this.attr("system")
            .boolean()
            .onSet(value => (this.id ? this.system : value))
            .setValue(false);

        this.attr("policies")
            .entities(Policy, "entity")
            .setUsing(Policies2Entities, "policy");

        this.on("delete", async () => {
            if (this.system) {
                throw Error("Cannot delete system security group.");
            }

            const inUse = await Groups2Entities.count({ query: { group: this.id } });
            if (inUse) {
                throw Error("Cannot delete group, already in use.");
            }
        });

        this.on("beforeCreate", async () => {
            const existingGroup = await Group.findOne({ query: { slug: this.slug } });
            if (existingGroup) {
                throw Error(`Group with slug "${this.slug}" already exists.`);
            }
        });

        // Let's just make sure security is up-to-date with all of the default policies.
        // We can do this only when working with the default group (policies are a bit different).
        this.on("afterSave", async () => {
            if (this.isDefault()) {
                api.services
                    .get("security")
                    .setDefaultPermissions(await Policy.getDefaultPoliciesPermissions());
            }
        });
    }

    isDefault() {
        return this.slug === "default";
    }

    static async getDefaultGroup(): Promise<Group> {
        const group: Group = (Group.findOne({ query: { slug: "default" } }): any);
        return group;
    }
}

Group.classId = "SecurityGroup";
Group.storageClassId = "Security_Groups";

class Groups2Entities extends Entity {
    entity: Entity;
    entityClassId: string;
    group: Group;
    constructor() {
        super();
        this.attr("entity").entity([], { classIdAttribute: "entityClassId" });
        this.attr("entityClassId").char();
        this.attr("group").entity(Group);
    }
}

Groups2Entities.classId = "SecurityGroups2Entities";
Groups2Entities.storageClassId = "Security_Groups2Entities";

export { Group, Groups2Entities };

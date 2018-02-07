// @flow
import { Entity } from "webiny-api";
import { Model } from "webiny-model";
import type { EntityCollection } from "webiny-entity";
import type { IAuthorizable } from "../../types";

/**
 * Identity class is the base class for all identity classes.
 * It is used to create your API user classes.
 *
 * @property {EntityCollection<Role>} roles
 */
export class Identity extends Entity implements IAuthorizable {
    constructor() {
        super();

        this.attr("roles")
            .entities(Role)
            .setUsing(Identity2Role);
    }

    /**
     * Checks whether the user has the specified role.
     * @param {string} role
     * @returns {boolean}
     */
    // eslint-disable-next-line
    async hasRole(role: string): Promise<boolean> {
        const roles = await this.getRoles();
        for (let i = 0; i < roles.length; i++) {
            if (roles[i].slug === role) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns all user's roles.
     * @returns {Array<Role>} All roles assigned to the user.
     */
    getRoles(): Promise<Array<Role> | EntityCollection<Role>> {
        return this.roles;
    }
}

Identity.classId = "Security.Identity";

export class Identity2Role extends Entity {
    constructor() {
        super();
        this.attr("identity").identity();
        this.attr("role").entity(Role);
    }
}

Identity2Role.classId = "Security.Identity2Role";

export class Role extends Entity {
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("slug")
            .char()
            .setValidators("required");
        this.attr("permissions")
            .entities(Permission)
            .setUsing(Role2Permission);
        this.attr("roleGroups")
            .entities(RoleGroup)
            .setUsing(Role2RoleGroup);
    }
}

Role.classId = "Security.Role";

export class Role2Permission extends Entity {
    constructor() {
        super();
        this.attr("role").entity(Role);
        this.attr("permission").entity(Permission);
    }
}

Role2Permission.classId = "Security.Role2Permission";

export class Permission extends Entity {
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("slug")
            .char()
            .setValidators("required");
        this.attr("rules").models(RuleModel);
        this.attr("roles")
            .entities(Role)
            .setUsing(Role2Permission);
    }
}

Permission.classId = "Security.Permission";

export class RoleGroup extends Entity {
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("slug")
            .char()
            .setValidators("required");
        this.attr("roles")
            .entities(Role)
            .setUsing(Role2RoleGroup);
    }
}

RoleGroup.classId = "Security.RoleGroup";

export class Role2RoleGroup extends Entity {
    constructor() {
        super();
        this.attr("role").entity(Role);
        this.attr("roleGroup").entity(RoleGroup);
    }
}

Role2RoleGroup.classId = "Security.Role2RoleGroup";

class RuleModel extends Model {
    constructor() {
        super();
        this.attr("classId")
            .char()
            .setValidators("required");
        this.attr("methods").models(
            new Model(function() {
                this.attr("method")
                    .char()
                    .setValidators("required");
            })
        );
    }
}

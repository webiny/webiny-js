// @flow
import { Entity } from "webiny-api";
import { Model } from "webiny-model";
import type { IAuthorizable } from "../../flow-typed";

/**
 * Identity class is the base class for all identity classes.
 * It is used to create your API user classes.
 */
export class Identity extends Entity implements IAuthorizable {
    /**
     * @param {boolean} canLogin Allow this identity to login. If true, `username` and `password` attributes are automatically added to the model.
     */
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
    hasRole(role: string): Promise<boolean> {
        // TODO
        return Promise.resolve(true);
    }

    /**
     * Returns all user's roles.
     * @returns {Array<Role>} All roles assigned to the user.
     */
    getRoles(): Promise<Array<Role>> {
        // TODO
        return Promise.resolve([]);
    }
}

Identity.classId = "Security.Identity";

export class Identity2Role extends Entity {
    constructor() {
        super();
        this.attr("identity").entity(Identity);
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
        this.attr("permissions").models(PermissionModel);
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

class PermissionModel extends Model {
    constructor() {
        super();
        this.attr("classId")
            .char()
            .setValidators("required");
        this.attr("rules").models(
            new Model(function() {
                this.attr("method")
                    .char()
                    .setValidators("required");
            })
        );
    }
}

// @flow
import { Entity } from "webiny-api";
import Role from "./role";
import RoleGroup from "./roleGroup";
import Identity2Role from "./identity2Role";
import Identity2RoleGroup from "./identity2RoleGroup";
import onSetFactory from "./helpers/onSetFactory";

import type { IAuthorizable } from "../../types";

/**
 * Identity class is the base class for all identity classes.
 * It is used to create your API user classes.
 *
 * @property {EntityCollection<Role>} roles
 * @property {EntityCollection<RoleGroup>} roleGroups
 */
class Identity extends Entity implements IAuthorizable {
    constructor() {
        super();
        this.attr("roles")
            .entities(Role, "identity", () => this.identityId)
            .setUsing(Identity2Role)
            .onSet(onSetFactory(Role));

        this.attr("roleGroups")
            .entities(RoleGroup, "identity", () => this.identityId)
            .setUsing(Identity2RoleGroup)
            .onSet(onSetFactory(RoleGroup));
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
    async getRoles(): Promise<Array<Role>> {
        const roles = [...(await this.roles)];
        const groups = await this.roleGroups;
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            roles.concat(...(await group.roles));
        }

        return roles;
    }
}

Identity.classId = "Security.Identity";

export default Identity;

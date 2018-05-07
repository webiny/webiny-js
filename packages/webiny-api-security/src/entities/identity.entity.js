// @flow
import { Entity } from "webiny-api";
import Role from "./role.entity";
import Identity2Role from "./identity2Role.entity";
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
            .onGet(onSetFactory(Role));
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
}

Identity.classId = "SecurityIdentity";

export default Identity;

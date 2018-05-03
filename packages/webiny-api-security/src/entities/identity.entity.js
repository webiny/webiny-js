// @flow
import { Entity } from "webiny-api";
import Role from "./role.entity";
import Permission from "./permission.entity";
import RoleGroup from "./roleGroup.entity";
import Identity2Role from "./identity2Role.entity";
import Identity2RoleGroup from "./identity2RoleGroup.entity";
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

        this.attr("roleGroups")
            .entities(RoleGroup, "identity", () => this.identityId)
            .setUsing(Identity2RoleGroup)
            .onGet(onSetFactory(RoleGroup));

        this.attr("scope")
            .object()
            .setDynamic(async () => {
                const roles = await this.roles;
                const roleGroups = await this.roleGroups;
                for (let i = 0; i < roleGroups.length; i++) {
                    let roleGroup = roleGroups[i];
                    const roleGroupRoles = await roleGroup.roles;
                    roleGroupRoles.forEach(roleGroupRole => {
                        if (roles.indexOf(roleGroupRole) === -1) {
                            roles.push(roleGroupRole);
                        }
                    });
                }

                const scope = {};
                for (let i = 0; i < roles.length; i++) {
                    let role = roles[i];
                    const permissions = await role.permissions;
                    permissions.forEach(permission => {
                        for (let operationName in permission.scope) {
                            if (!scope[operationName]) {
                                scope[operationName] = [];
                            }

                            scope[operationName].push(permission.scope[operationName]);
                        }
                    });
                }

                const anonymousPermission = await Permission.findOne({
                    query: { slug: "anonymous" }
                });
                for (let operationName in anonymousPermission.scope) {
                    if (!scope[operationName]) {
                        scope[operationName] = [];
                    }

                    scope[operationName].push(anonymousPermission.scope[operationName]);
                }

                return scope;
            });
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
        let roles = [...(await this.roles)];
        const groups = await this.roleGroups;
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const groupRoles = await group.roles;
            roles = roles.concat(...groupRoles);
        }

        return roles;
    }
}

Identity.classId = "SecurityIdentity";

export default Identity;

import deepEqual from "deep-equal";
import { createImplementation } from "@webiny/feature/api";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { UpdateTenantLinks } from "../UpdateTenantLinks/abstractions.js";
import { GroupAfterUpdateHandler } from "~/features/groups/UpdateGroup/index.js";
import type { PermissionsTenantLink } from "~/types.js";
import { ListTenantLinksByType } from "~/features/tenantLinks/ListTenantLinksByType/index.js";

class GroupAfterUpdateHandlerImpl implements GroupAfterUpdateHandler.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private listTenantLinksByType: ListTenantLinksByType.Interface,
        private updateTenantLinks: UpdateTenantLinks.Interface
    ) {}

    async handle(event: GroupAfterUpdateHandler.Event): Promise<void> {
        const { original, updated } = event.payload;

        // Only update tenant links if permissions changed
        const permissionsChanged = !deepEqual(updated.permissions, original.permissions);
        if (!permissionsChanged) {
            return;
        }

        const tenant = this.tenantContext.getTenant();

        // Get all tenant links of type "group"
        const linksResult = await this.listTenantLinksByType.execute({
            tenant: tenant.id,
            type: "group"
        });

        if (linksResult.isFail()) {
            throw new Error(`Failed to list tenant links: ${linksResult.error.message}`);
        }

        const links = linksResult.value as PermissionsTenantLink[];

        if (!links.length) {
            return;
        }

        // Filter and update links that reference the updated group
        const linksToUpdate = links
            .filter(link => {
                const linkGroups = link.data?.groups;
                const linkHasGroups = Array.isArray(linkGroups) && linkGroups.length;
                if (linkHasGroups) {
                    const linkHasGroup = linkGroups.some(item => item.id === updated.id);
                    if (linkHasGroup) {
                        return true;
                    }
                }

                const linkTeams = link.data?.teams;
                const linkHasTeams = Array.isArray(linkTeams) && linkTeams.length;
                if (linkHasTeams) {
                    const linkHasTeamWithGroup = linkTeams.some(team =>
                        team.groups.some(teamGroup => teamGroup.id === updated.id)
                    );

                    if (linkHasTeamWithGroup) {
                        return true;
                    }
                }

                return false;
            })
            .map(link => {
                const data = { ...link.data };

                const linkGroups = link.data?.groups;
                const linkHasGroups = Array.isArray(linkGroups) && linkGroups.length;
                if (linkHasGroups) {
                    const linkHasGroup = linkGroups.some(item => item.id === updated.id);
                    if (linkHasGroup) {
                        data.groups = linkGroups.map(item => {
                            if (item.id !== updated.id) {
                                return item;
                            }

                            return {
                                id: updated.id,
                                permissions: updated.permissions
                            };
                        });
                    }
                }

                const linkTeams = link.data?.teams;
                const linkHasTeams = Array.isArray(linkTeams) && linkTeams.length;
                if (linkHasTeams) {
                    const linkHasTeamWithGroup = linkTeams.some(team =>
                        team.groups.some(teamGroup => teamGroup.id === updated.id)
                    );

                    if (linkHasTeamWithGroup) {
                        data.teams = linkTeams.map(team => {
                            const teamGroups = team.groups.map(teamGroup => {
                                if (teamGroup.id !== updated.id) {
                                    return teamGroup;
                                }

                                return {
                                    id: updated.id,
                                    permissions: updated.permissions
                                };
                            });

                            return {
                                ...team,
                                groups: teamGroups
                            };
                        });
                    }
                }

                return {
                    tenant: link.tenant,
                    identity: link.identity,
                    type: link.type,
                    data
                };
            });

        if (linksToUpdate.length === 0) {
            return;
        }

        const updateResult = await this.updateTenantLinks.execute(linksToUpdate);
        if (updateResult.isFail()) {
            throw new Error(`Failed to update tenant links: ${updateResult.error.message}`);
        }
    }
}

export const UpdateTenantLinksAfterGroupUpdate = createImplementation({
    abstraction: GroupAfterUpdateHandler,
    implementation: GroupAfterUpdateHandlerImpl,
    dependencies: [TenantContext, ListTenantLinksByType, UpdateTenantLinks]
});

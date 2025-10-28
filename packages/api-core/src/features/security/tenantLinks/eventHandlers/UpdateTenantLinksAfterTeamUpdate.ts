import deepEqual from "deep-equal";
import { createImplementation } from "@webiny/feature/api";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { UpdateTenantLinks } from "../UpdateTenantLinks/abstractions.js";
import { TeamAfterUpdateHandler } from "~/features/teams/UpdateTeam/index.js";
import { ListTenantLinksByType } from "~/features/tenantLinks/ListTenantLinksByType/index.js";
import { ListGroupsUseCase } from "~/features/groups/ListGroups/index.js";
import type { PermissionsTenantLink } from "~/types.js";

class TeamAfterUpdateHandlerImpl implements TeamAfterUpdateHandler.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private listTenantLinksByType: ListTenantLinksByType.Interface,
        private listGroups: ListGroupsUseCase.Interface,
        private updateTenantLinks: UpdateTenantLinks.Interface
    ) {}

    async handle(event: TeamAfterUpdateHandler.Event): Promise<void> {
        const { original, updated } = event.payload;

        // Only update tenant links if groups changed
        const groupsChanged = !deepEqual(updated.groups, original.groups);
        if (!groupsChanged) {
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

        // Filter links that reference the updated team
        const relevantLinks = links.filter(link => {
            const linkTeams = link.data?.teams;
            if (Array.isArray(linkTeams) && linkTeams.length > 0) {
                return linkTeams.some(team => team.id === updated.id);
            }

            return false;
        });

        if (!relevantLinks.length) {
            return;
        }

        // Get the updated team's groups
        const teamGroupsResult = await this.listGroups.execute({
            where: { id_in: updated.groups }
        });

        if (teamGroupsResult.isFail()) {
            throw new Error(`Failed to list groups: ${teamGroupsResult.error.message}`);
        }

        const teamGroups = teamGroupsResult.value;

        // Update tenant links with the new team groups
        const linksToUpdate = relevantLinks.map(link => {
            // We know the `link.data` is not undefined, because we filtered out all links that don't have any teams.
            const linkTeams = link.data!.teams;

            return {
                tenant: link.tenant,
                identity: link.identity,
                type: link.type,
                data: {
                    ...link.data,
                    teams: linkTeams.map(linkTeam => {
                        if (linkTeam.id !== updated.id) {
                            return linkTeam;
                        }

                        return {
                            id: updated.id,
                            groups: teamGroups.map(group => ({
                                id: group.id,
                                permissions: group.permissions
                            }))
                        };
                    })
                }
            };
        });

        const updateResult = await this.updateTenantLinks.execute(linksToUpdate);
        if (updateResult.isFail()) {
            throw new Error(`Failed to update tenant links: ${updateResult.error.message}`);
        }
    }
}

export const UpdateTenantLinksAfterTeamUpdate = createImplementation({
    abstraction: TeamAfterUpdateHandler,
    implementation: TeamAfterUpdateHandlerImpl,
    dependencies: [TenantContext, ListTenantLinksByType, ListGroupsUseCase, UpdateTenantLinks]
});

import { WcpContext } from "~/features/wcp/WcpContext/index.js";
import type { SecurityRole } from "~/types/security.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { PermissionsProcessor } from "./abstractions.js";
import { GroupsRepository } from "~/features/security/groups/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { getPermissionsFromSecurityGroups } from "~/features/security/utils/getPermissionsFromSecurityGroups.js";

export type GroupSlug = string | undefined;
export type TeamSlug = string | undefined;

class GetPermissionsFromGroupsAndTeamsImpl implements PermissionsProcessor.Interface {
    constructor(
        private wcpContext: WcpContext.Interface,
        private identityContext: IdentityContext.Interface,
        private groupsRepository: GroupsRepository.Interface,
        private teamsRepository: TeamsRepository.Interface
    ) {}

    async getPermissions() {
        const identity = this.identityContext.getIdentity();

        // Load groups that are associated with the current identity. Also load groups
        // that are assigned via one or more teams (if the Teams feature is enabled).
        const groupSlugs: GroupSlug[] = [];
        const teamSlugs: TeamSlug[] = [];

        if (identity.profile.groups) {
            groupSlugs.push(...identity.profile.groups);
        }

        const filteredGroupSlugs = groupSlugs.filter(Boolean) as string[];
        const dedupedGroupSlugs = Array.from(new Set(filteredGroupSlugs));

        const loadedGroups: SecurityRole[] = [];

        if (dedupedGroupSlugs.length > 0) {
            const groupsResult = await this.groupsRepository.list({
                where: { slug_in: dedupedGroupSlugs }
            });

            const loadedGroupsBySlugs = groupsResult.isOk() ? groupsResult.value : [];
            loadedGroups.push(...loadedGroupsBySlugs);
        }

        if (this.wcpContext.canUseTeams()) {
            if (identity.profile.teams) {
                teamSlugs.push(...identity.profile.teams);
            }

            const filteredTeamSlugs = teamSlugs.filter(Boolean) as string[];
            const dedupedTeamSlugs = Array.from(new Set(filteredTeamSlugs));

            if (dedupedTeamSlugs.length > 0) {
                const teamsResult = await this.teamsRepository.list({
                    where: { slug_in: dedupedTeamSlugs }
                });

                const loadedTeams = teamsResult.isOk() ? teamsResult.value : [];

                // Upon returning teams, we're filtering out team groups that were already loaded.
                // Also note that `team.groups` contains group IDs, not slugs.
                const groupIdsFromTeams = loadedTeams
                    .flatMap(team => team.groups)
                    .filter(groupId => {
                        const alreadyLoaded = loadedGroups.find(group => group.id === groupId);
                        return !alreadyLoaded;
                    });

                if (groupIdsFromTeams.length > 0) {
                    const moreGroupsResult = await this.groupsRepository.list({
                        where: { id_in: groupIdsFromTeams }
                    });

                    const groupsFromTeams = moreGroupsResult.isOk() ? moreGroupsResult.value : [];
                    loadedGroups.push(...groupsFromTeams);
                }
            }
        }

        if (loadedGroups.length > 0) {
            return getPermissionsFromSecurityGroups(loadedGroups);
        }

        return null;
    }
}

export const GetPermissionsFromGroupsAndTeams = PermissionsProcessor.createImplementation({
    implementation: GetPermissionsFromGroupsAndTeamsImpl,
    dependencies: [WcpContext, IdentityContext, GroupsRepository, TeamsRepository]
});

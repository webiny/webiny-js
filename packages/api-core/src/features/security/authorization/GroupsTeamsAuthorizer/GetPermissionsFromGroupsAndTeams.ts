import { WcpContext } from "~/features/wcp/WcpContext/index.js";
import type { SecurityRole } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";
import { PermissionsProcessor } from "./abstractions.js";
import { GroupsRepository } from "~/features/security/groups/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { getPermissionsFromSecurityGroups } from "~/features/security/utils/getPermissionsFromSecurityGroups.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";

export type GroupId = string | undefined;
export type TeamId = string | undefined;

class GetPermissionsFromGroupsAndTeamsImpl implements PermissionsProcessor.Interface {
    constructor(
        private wcpContext: WcpContext.Interface,
        private usersRepository: AdminUsersRepository.Interface,
        private groupsRepository: GroupsRepository.Interface,
        private teamsRepository: TeamsRepository.Interface
    ) {}

    async getPermissions(identity: Identity) {
        const userResult = await this.usersRepository.get({ id: identity.id });
        if (userResult.isFail()) {
            return null;
        }

        const user = userResult.value;

        // Load groups that are associated with the current identity. Also load groups
        // that are assigned via one or more teams (if the Teams feature is enabled).
        const groupIds: GroupId[] = [];
        const teamIds: TeamId[] = [];

        groupIds.push(...(user.groups ?? []));

        const filteredGroupIds = groupIds.filter(Boolean) as string[];
        const dedupedGroupIds = Array.from(new Set(filteredGroupIds));

        const loadedGroups: SecurityRole[] = [];

        if (dedupedGroupIds.length > 0) {
            const groupsResult = await this.groupsRepository.list({
                where: { id_in: dedupedGroupIds }
            });

            const loadedGroupsByIds = groupsResult.isOk() ? groupsResult.value : [];
            loadedGroups.push(...loadedGroupsByIds);
        }

        if (this.wcpContext.canUseTeams()) {
            teamIds.push(...(user.teams ?? []));

            const filteredTeamIds = teamIds.filter(Boolean) as string[];
            const dedupedTeamIds = Array.from(new Set(filteredTeamIds));

            if (dedupedTeamIds.length > 0) {
                const teamsResult = await this.teamsRepository.list({
                    where: { id_in: dedupedTeamIds }
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
    dependencies: [WcpContext, AdminUsersRepository, GroupsRepository, TeamsRepository]
});

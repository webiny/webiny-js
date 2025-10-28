import { getPermissionsFromSecurityGroupsForLocale } from "../getPermissionsFromSecurityGroupsForLocale.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";
import type { ApiCoreContext } from "~/types/core.js";
import type { SecurityIdentity, SecurityRole } from "~/types/security.js";

export type GroupSlug = string | undefined;
export type TeamSlug = string | undefined;

export interface GroupsTeamsAuthorizerConfig<TContext extends ApiCoreContext = ApiCoreContext> {
    /**
     * Specify an `identityType` if you want to only run this authorizer for specific identities.
     */
    identityType?: string;

    /**
     * If a security group is not found, try loading it from a parent tenant (default: true).
     */
    inheritGroupsFromParentTenant?: boolean;

    /**
     * Check whether the current identity is authorized to access the current tenant.
     */
    canAccessTenant?: (context: TContext) => boolean | Promise<boolean>;
}

export interface ListPermissionsFromGroupsAndTeamsParams<
    TContext extends ApiCoreContext = ApiCoreContext
> {
    config: GroupsTeamsAuthorizerConfig<TContext>;
    identity: SecurityIdentity;
    localeCode: string;
    context: TContext;
}

export const listPermissionsFromGroupsAndTeams = async <
    TContext extends ApiCoreContext = ApiCoreContext
>(
    params: ListPermissionsFromGroupsAndTeamsParams<TContext>
) => {
    const { context, identity, localeCode } = params;
    const { security } = context;

    const wcp = context.container.resolve(WcpContext);

    // Load groups that are associated with the current identity. Also load groups
    // that are assigned via one or more teams (if the Teams feature is enabled).
    const groupSlugs: GroupSlug[] = [];
    const teamSlugs: TeamSlug[] = [];

    if (identity.groups) {
        groupSlugs.push(...identity.groups);
    }

    const filteredGroupSlugs = groupSlugs.filter(Boolean) as string[];
    const dedupedGroupSlugs = Array.from(new Set(filteredGroupSlugs));

    const loadedGroups: SecurityRole[] = [];

    if (dedupedGroupSlugs.length > 0) {
        // Load groups coming from teams.
        const loadedGroupsBySlugs = await security.withoutAuthorization(() => {
            return security.listGroups({
                where: { slug_in: dedupedGroupSlugs }
            });
        });

        if (loadedGroupsBySlugs.length > 0) {
            loadedGroups.push(...loadedGroupsBySlugs);
        }
    }

    if (wcp.canUseTeams()) {
        if (identity.teams) {
            teamSlugs.push(...identity.teams);
        }

        const filteredTeamSlugs = teamSlugs.filter(Boolean) as string[];
        const dedupedTeamSlugs = Array.from(new Set(filteredTeamSlugs));

        if (dedupedTeamSlugs.length > 0) {
            const loadedTeams = await security.withoutAuthorization(() => {
                return security.listTeams({
                    where: { slug_in: dedupedTeamSlugs }
                });
            });

            // Upon returning group IDs from teams, we're also filtering out groups that were already loaded.
            // Also note that `team.groups` contains group IDs, not slugs. Hence, we need to load groups by IDs.
            const groupIdsFromTeams = loadedTeams
                .map(team => team.groups)
                .flat()
                .filter(groupId => {
                    const alreadyLoaded = loadedGroups.find(group => group.id === groupId);
                    return !alreadyLoaded;
                });

            if (groupIdsFromTeams.length > 0) {
                const loadedGroupsFromTeams = await security.withoutAuthorization(() => {
                    return security.listGroups({
                        where: { id_in: groupIdsFromTeams }
                    });
                });

                if (loadedGroupsFromTeams.length > 0) {
                    loadedGroups.push(...loadedGroupsFromTeams);
                }
            }
        }
    }

    if (loadedGroups.length > 0) {
        return getPermissionsFromSecurityGroupsForLocale(loadedGroups, localeCode);
    }

    return null;
};

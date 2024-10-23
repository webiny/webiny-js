import { getPermissionsFromSecurityGroupsForLocale } from "../getPermissionsFromSecurityGroupsForLocale";
import { SecurityContext } from "~/types";
import { Identity } from "@webiny/api-authentication/types";

export type GroupSlug = string | undefined;
export type TeamSlug = string | undefined;

export interface GroupsTeamsAuthorizerConfig<TContext extends SecurityContext = SecurityContext> {
    /**
     * Specify an `identityType` if you want to only run this authorizer for specific identities.
     */
    identityType?: string;

    /**
     * @deprecated Use `listGroupSlugs` instead.
     * Get a group slug to load permissions from.
     */
    getGroupSlug?: (context: TContext) => Promise<GroupSlug> | GroupSlug;

    /**
     * List group slugs to load permissions from.
     */
    listGroupSlugs?: (context: TContext) => Promise<GroupSlug[]> | GroupSlug[];

    /**
     * List team slugs to load groups and ultimately permissions from.
     */
    listTeamSlugs?: (context: TContext) => Promise<TeamSlug[]> | TeamSlug[];

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
    TContext extends SecurityContext = SecurityContext
> {
    config: GroupsTeamsAuthorizerConfig<TContext>;
    identity: Identity;
    localeCode: string;
    context: TContext;
}

export const listPermissionsFromGroupsAndTeams = async <
    TContext extends SecurityContext = SecurityContext
>(
    params: ListPermissionsFromGroupsAndTeamsParams<TContext>
) => {
    const { config, context, identity, localeCode } = params;
    const { security, wcp } = context;

    // Load groups that are associated with the current identity. Also load groups
    // that are assigned via one or more teams (if the Teams feature is enabled).
    const groupSlugs: GroupSlug[] = [];
    const teamSlugs: TeamSlug[] = [];

    if (config.getGroupSlug) {
        const loadedGroupSlug = await config.getGroupSlug(context);
        groupSlugs.push(loadedGroupSlug);
    }

    if (config.listGroupSlugs) {
        const loadedGroupSlugs = await config.listGroupSlugs(context);
        groupSlugs.push(...loadedGroupSlugs);
    }

    if (identity.group) {
        groupSlugs.push(identity.group);
    }

    if (identity.groups) {
        groupSlugs.push(...identity.groups);
    }

    if (wcp.canUseTeams()) {
        // Load groups coming from teams.
        if (config.listTeamSlugs) {
            const loadedTeamSlugs = await config.listTeamSlugs(context);
            teamSlugs.push(...loadedTeamSlugs);
        }

        if (identity.team) {
            teamSlugs.push(identity.team);
        }

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

            const groupSlugsFromTeams = loadedTeams.map(team => team.groups).flat();
            groupSlugs.push(...groupSlugsFromTeams);
        }
    }

    const filteredGroupSlugs = groupSlugs.filter(Boolean) as string[];
    const dedupedGroupSlugs = Array.from(new Set(filteredGroupSlugs));

    if (dedupedGroupSlugs.length > 0) {
        // Load groups coming from teams.
        const loadedGroups = await security.withoutAuthorization(() => {
            return security.listGroups({
                where: { slug_in: dedupedGroupSlugs }
            });
        });

        if (loadedGroups.length > 0) {
            return getPermissionsFromSecurityGroupsForLocale(loadedGroups, localeCode);
        }
    }

    return null;
};

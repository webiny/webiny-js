import { ContextPlugin } from "@webiny/handler";
import { getPermissionsFromSecurityGroupsForLocale } from "./utils/getPermissionsFromSecurityGroupsForLocale";
import { SecurityContext } from "~/types";

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

export const createGroupsTeamsAuthorizer = <TContext extends SecurityContext = SecurityContext>(
    config: GroupsTeamsAuthorizerConfig<TContext>
) => {
    return new ContextPlugin<TContext>(context => {
        const { security, wcp } = context;
        security.addAuthorizer(async () => {
            const identity = security.getIdentity();
            if (!identity) {
                return null;
            }

            // If `identityType` is specified, we'll only execute this authorizer for a matching identity.
            if (config.identityType && identity.type !== config.identityType) {
                return null;
            }

            // @ts-expect-error Check `packages/api-security/src/plugins/tenantLinkAuthorization.ts:23`.
            const locale = context.i18n?.getContentLocale();
            if (!locale) {
                return null;
            }

            if (config.canAccessTenant) {
                const canAccessTenant = await config.canAccessTenant(context);
                if (!canAccessTenant) {
                    return [];
                }
            }

            // Load groups that are associated with the current identity. Also load groups
            // that are assigned via one or more teams (if the Teams feature is enabled).
            const groupSlugs: GroupSlug[] = [];
            const teamSlugs: TeamSlug[] = [];

            if (config.getGroupSlug) {
                const groupSlug = await config.getGroupSlug(context);
                if (groupSlug) {
                    groupSlugs.push(groupSlug);
                }
            }

            if (config.listGroupSlugs) {
                const groupSlugs = await config.listGroupSlugs(context);
                groupSlugs.push(...groupSlugs);
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
                    const teamSlugs = await config.listTeamSlugs(context);
                    teamSlugs.push(...groupSlugs);
                }

                if (identity.team) {
                    teamSlugs.push(identity.team);
                }

                if (identity.teams) {
                    teamSlugs.push(...identity.teams);
                }

                const loadedTeams = await security.withoutAuthorization(() => {
                    return security.listTeams({
                        where: { slug_in: teamSlugs.filter(Boolean) as string[] }
                    });
                });

                groupSlugs.push(...loadedTeams.map(team => team.groups).flat());
            }

            const dedupedGroupSlugs = Array.from(new Set(groupSlugs)) as string[];

            // Load groups coming from teams.
            const loadedGroups = await security.withoutAuthorization(() => {
                return security.listGroups({
                    where: { slug_in: dedupedGroupSlugs }
                });
            });

            if (loadedGroups.length > 0) {
                return getPermissionsFromSecurityGroupsForLocale(loadedGroups, locale.code);
            }

            // If no security group was found, it could be due to an identity accessing a sub-tenant.
            // In this case, let's try loading a security group from the parent tenant.

            // NOTE: this will work well for flat tenant hierarchy where there's a `root` tenant and 1 level of sibling sub-tenants.
            // For multi-level hierarchy, the best approach is to code a plugin with the desired permission fetching logic.

            const tenant = context.tenancy.getCurrentTenant();

            const parentTenant = tenant.parent;
            if (parentTenant && config.inheritGroupsFromParentTenant !== false) {
                const groups = await security.withoutAuthorization(() => {
                    return security.listGroups({
                        where: { tenant: parentTenant, slug_in: dedupedGroupSlugs }
                    });
                });

                if (groups.length > 0) {
                    return getPermissionsFromSecurityGroupsForLocale(groups, locale.code);
                }
            }

            return null;
        });
    });
};

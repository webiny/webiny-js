import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "~/types/core.js";
import { getPermissionsFromSecurityGroups } from "~/features/security/utils/getPermissionsFromSecurityGroups.js";
import type { PermissionsTenantLink } from "~/types/security.js";

export interface Config {
    identityType?: string;
    testTenantLink?: Pick<PermissionsTenantLink, "data">;
    parent?: boolean;
}

export const createTenantLinkAuthorizer =
    (config: Config) => (context: ApiCoreContext) => async () => {
        const identity = context.security.getIdentity();
        const tenant = context.tenancy.getCurrentTenant();

        if (!identity || identity.type !== config.identityType) {
            return null;
        }

        const tenantId = config.parent ? tenant.parent : tenant.id;
        if (!tenantId) {
            return null;
        }

        const tenantLink =
            config.testTenantLink ||
            (await context.security.getTenantLinkByIdentity<PermissionsTenantLink>({
                identity: identity.id,
                tenant: tenantId
            }));

        if (!tenantLink) {
            return null;
        }

        const allGroups = [];

        const groups = tenantLink.data?.groups;
        if (Array.isArray(groups)) {
            allGroups.push(...groups);
        }

        const teamsEnabled = context.wcp.canUseTeams();

        if (teamsEnabled) {
            // Pick all groups and teams groups and get permissions from them.
            // Note that we return only permissions that are relevant for current locale.
            const teamsGroups = tenantLink.data?.teams.map(team => team.groups).flat();
            if (Array.isArray(teamsGroups)) {
                allGroups.push(...teamsGroups);
            }
        }

        // Although only one group is allowed, we still pretend multiples are possible.
        // This way, in the near future, we can support multiple groups per tenant.
        return getPermissionsFromSecurityGroups(allGroups);
    };

export default (config: Config) => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.security.addAuthorizer(createTenantLinkAuthorizer(config)(context));
    });
};

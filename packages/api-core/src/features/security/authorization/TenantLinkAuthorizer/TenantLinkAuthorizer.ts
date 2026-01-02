import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import type { PermissionsTenantLink, SecurityPermission } from "~/types/security.js";
import { getPermissionsFromSecurityGroups } from "~/features/security/utils/getPermissionsFromSecurityGroups.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";
import { ListTenantLinksByIdentity } from "~/features/security/tenantLinks/ListTenantLinksByIdentity/index.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

class TenantLinkAuthorizerImpl implements Authorizer.Interface {
    constructor(
        private readonly wcpContext: WcpContext.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly listTenantLinks: ListTenantLinksByIdentity.Interface
    ) {}

    async authorize(identity: Identity): Promise<SecurityPermission[] | null> {
        const tenant = this.tenantContext.getTenant();

        if (identity.isAnonymous() || identity.type !== "admin") {
            return null;
        }

        // Exit early if no tenant links exist for identity
        const result = await this.listTenantLinks.execute({ identity: identity.id });
        if (result.isFail()) {
            return null;
        }

        const tenantLinks = result.value;
        if (tenantLinks.length === 0) {
            return null;
        }

        let permissions = await this.getPermissionsFromTenant(tenant.id, tenantLinks);

        // If no permissions were found on the current tenant, try loading them from the parent tenant.
        if (!permissions && tenant.parent) {
            permissions = await this.getPermissionsFromTenant(tenant.parent, tenantLinks);
        }

        return permissions;
    }

    private async getPermissionsFromTenant(tenantId: string, tenantLinks: PermissionsTenantLink[]) {
        const tenantLink = tenantLinks.find(link => link.tenant === tenantId);

        if (!tenantLink) {
            return null;
        }

        const allGroups = [];

        const groups = tenantLink.data?.groups ?? [];
        allGroups.push(...groups);

        const teamsEnabled = this.wcpContext.canUseTeams();

        if (teamsEnabled) {
            // Pick all groups and teams groups and get permissions from them.
            const teamsGroups = tenantLink.data?.teams.flatMap(team => team.groups) ?? [];
            allGroups.push(...teamsGroups);
        }

        // Although only one group is allowed, we still pretend multiples are possible.
        return getPermissionsFromSecurityGroups(allGroups);
    }
}

export const TenantLinkAuthorizer = Authorizer.createImplementation({
    implementation: TenantLinkAuthorizerImpl,
    dependencies: [WcpContext, TenantContext, ListTenantLinksByIdentity]
});

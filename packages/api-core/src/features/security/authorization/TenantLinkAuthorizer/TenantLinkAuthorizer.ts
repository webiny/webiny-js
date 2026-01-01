import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import type { PermissionsTenantLink, SecurityPermission } from "~/types/security.js";
import { getPermissionsFromSecurityGroups } from "~/features/security/utils/getPermissionsFromSecurityGroups.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { Identity, IdentityContext } from "~/features/security/IdentityContext/index.js";
import { GetTenantLinkByIdentity } from "~/features/security/tenantLinks/GetTenantLinkByIdentity/index.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";

class TenantLinkAuthorizerImpl implements Authorizer.Interface {
    constructor(
        private readonly wcpContext: WcpContext.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly getTenantLinkByIdentity: GetTenantLinkByIdentity.Interface
    ) {}

    async authorize(): Promise<SecurityPermission[] | null> {
        const identity = this.identityContext.getIdentity();
        const tenant = this.tenantContext.getTenant();

        if (identity.isAnonymous() || identity.type !== "admin") {
            return null;
        }

        // TODO: this should be done via an optional decorator, so the logic of
        // TODO: loading parent tenant permissions can be configurable.

        let permissions = await this.getPermissionsFromTenant(tenant.id, identity);

        // If no permissions were found on the current tenant, try loading them from the parent tenant.
        if (!permissions && tenant.parent) {
            permissions = await this.getPermissionsFromTenant(tenant.parent, identity);
        }

        return permissions;
    }

    private async getPermissionsFromTenant(tenantId: string, identity: Identity) {
        const tenantLinkResult = await this.getTenantLinkByIdentity.execute<PermissionsTenantLink>({
            identity: identity.id,
            tenant: tenantId
        });

        if (tenantLinkResult.isFail()) {
            return null;
        }

        const tenantLink = tenantLinkResult.value;

        if (!tenantLink) {
            return null;
        }

        const allGroups = [];

        const groups = tenantLink.data?.groups;
        if (Array.isArray(groups)) {
            allGroups.push(...groups);
        }

        const teamsEnabled = this.wcpContext.canUseTeams();

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
    }
}

export const TenantLinkAuthorizer = Authorizer.createImplementation({
    implementation: TenantLinkAuthorizerImpl,
    dependencies: [WcpContext, TenantContext, IdentityContext, GetTenantLinkByIdentity]
});

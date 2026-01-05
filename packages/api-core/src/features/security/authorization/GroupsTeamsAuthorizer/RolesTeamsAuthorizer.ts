import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import { Identity } from "~/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "~/types/security.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import { PermissionsProcessor } from "./abstractions.js";

class GroupsTeamsAuthorizerImpl implements Authorizer.Interface {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly getTenantByIdUseCase: GetTenantByIdUseCase.Interface,
        private readonly permissionsProcessor: PermissionsProcessor.Interface
    ) {}

    async authorize(identity: Identity): Promise<SecurityPermission[] | null> {
        const tenant = this.tenantContext.getTenant();

        if (identity.isAnonymous() || identity.type !== "admin") {
            return null;
        }

        if (!identity.context.canAccessTenant) {
            return [];
        }

        const currentTenantPermissions = await this.permissionsProcessor.getPermissions(identity);

        if (Array.isArray(currentTenantPermissions)) {
            return currentTenantPermissions;
        }

        // If no security roles were found, it could be due to an identity accessing a sub-tenant. In this case,
        // let's try loading permissions from the parent tenant. Note that this will work well for flat tenant
        // hierarchy where there's a `root` tenant and 1 level of sibling sub-tenants. For multi-level hierarchy,
        // the best approach is to code a plugin with the desired permissions-fetching logic.
        const parentTenantId = tenant.parent;
        if (!parentTenantId) {
            return null;
        }

        const result = await this.getTenantByIdUseCase.execute(parentTenantId);
        if (result.isFail()) {
            return null;
        }

        const parentTenant = result.value;

        const parentTenantPermissions = await this.tenantContext.withTenant(parentTenant, () => {
            return this.permissionsProcessor.getPermissions(identity);
        });

        if (Array.isArray(parentTenantPermissions)) {
            return parentTenantPermissions;
        }

        return null;
    }
}

export const RolesTeamsAuthorizer = Authorizer.createImplementation({
    implementation: GroupsTeamsAuthorizerImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase, PermissionsProcessor]
});

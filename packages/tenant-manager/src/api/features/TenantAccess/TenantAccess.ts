import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import { ResolveIdentityTenantsUseCase } from "@webiny/api-core/features/security/ResolveIdentityTenants/index.js";
import { TenantAccess as Abstraction } from "./abstractions.js";
import { TenantNotChildError, TenantNotFoundError } from "../../domain/errors.js";

const ROOT_TENANT_ID = "root";

class TenantAccess implements Abstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private getTenantById: GetTenantByIdUseCase.Interface,
        private resolveIdentityTenants: ResolveIdentityTenantsUseCase.Interface
    ) {}

    async canCreate() {
        if (!(await this.identityContext.getPermission("tm.tenant"))) {
            return Result.fail(new NotAuthorizedError());
        }
        return Result.ok();
    }

    async canList() {
        const canCreate = await this.canCreate();
        if (canCreate.isFail()) {
            return canCreate;
        }

        /* `tm.tenant` alone isn't enough: a user with full access in a sub-tenant has it there too,
           and must not see the root's other tenants. Only users of the root tenant list them. */
        const identity = this.identityContext.getIdentity();
        const tenantsResult = await this.resolveIdentityTenants.execute(identity.id);
        if (tenantsResult.isFail()) {
            return Result.fail(new NotAuthorizedError());
        }

        const isRootUser = tenantsResult.value.some(tenant => tenant.id === ROOT_TENANT_ID);
        if (!isRootUser) {
            return Result.fail(new NotAuthorizedError());
        }

        return Result.ok();
    }

    async canManage(tenantId: string) {
        const canCreate = await this.canCreate();
        if (canCreate.isFail()) {
            return canCreate;
        }

        const tenantResult = await this.getTenantById.execute(tenantId);
        if (tenantResult.isFail()) {
            return Result.fail(new TenantNotFoundError(tenantId));
        }

        /* Only a direct child of the current tenant. This also rules out the root tenant
           (no parent) and the current tenant itself. */
        if (tenantResult.value.parent !== this.tenantContext.getTenant().id) {
            return Result.fail(new TenantNotChildError(tenantId));
        }

        return Result.ok();
    }
}

export default Abstraction.createImplementation({
    implementation: TenantAccess,
    dependencies: [
        IdentityContext,
        TenantContext,
        GetTenantByIdUseCase,
        ResolveIdentityTenantsUseCase
    ]
});

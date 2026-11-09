import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import { TenantAccess as Abstraction } from "./abstractions.js";
import { TenantNotChildError, TenantNotFoundError } from "../../domain/errors.js";

class TenantAccess implements Abstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private getTenantById: GetTenantByIdUseCase.Interface
    ) {}

    async canCreate() {
        if (!(await this.identityContext.getPermission("tm.tenant"))) {
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
    dependencies: [IdentityContext, TenantContext, GetTenantByIdUseCase]
});

import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { DeleteTenantUseCase as CoreDeleteTenantUseCase } from "@webiny/api-core/features/tenancy/DeleteTenant/index.js";
import { DeleteTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import {
    TenantHasChildrenError,
    TenantNotChildError,
    TenantNotFoundError,
    TenantPersistenceError
} from "../../domain/errors.js";

class DeleteTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private getTenantById: GetTenantByIdUseCase.Interface,
        private listTenants: ListTenantsUseCase.Interface,
        private coreDeleteTenant: CoreDeleteTenantUseCase.Interface
    ) {}

    async canDelete(tenantId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        if (!(await this.identityContext.getPermission("tm.tenant"))) {
            return Result.fail(new NotAuthorizedError());
        }

        const tenantResult = await this.getTenantById.execute(tenantId);
        if (tenantResult.isFail()) {
            return Result.fail(new TenantNotFoundError(tenantId));
        }

        /* Only a direct sub-tenant of the current tenant. This also rules out the root tenant
           (no parent) and the current tenant itself. */
        const currentTenant = this.tenantContext.getTenant();
        if (tenantResult.value.parent !== currentTenant.id) {
            return Result.fail(new TenantNotChildError(tenantId));
        }

        /* Never delete a whole subtree. */
        const childrenResult = await this.listTenants.execute({ parent: tenantId });
        if (childrenResult.isFail()) {
            return Result.fail(new TenantPersistenceError(childrenResult.error));
        }
        if (childrenResult.value.length > 0) {
            return Result.fail(new TenantHasChildrenError(tenantId));
        }

        return Result.ok();
    }

    async execute(tenantId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const canDelete = await this.canDelete(tenantId);
        if (canDelete.isFail()) {
            return canDelete;
        }

        try {
            await this.coreDeleteTenant.execute(tenantId);
        } catch (error) {
            return Result.fail(new TenantPersistenceError(error as Error));
        }

        return Result.ok();
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: DeleteTenantUseCase,
    dependencies: [
        IdentityContext,
        TenantContext,
        GetTenantByIdUseCase,
        ListTenantsUseCase,
        CoreDeleteTenantUseCase
    ]
});

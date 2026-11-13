import { Result } from "@webiny/feature/api";
import { TenantAccess } from "~/api/features/TenantAccess/abstractions.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { DeleteTenantUseCase as CoreDeleteTenantUseCase } from "@webiny/api-core/features/tenancy/DeleteTenant/index.js";
import { DeleteTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import {
    TenantHasChildrenError,
    TenantNotFoundError,
    TenantPersistenceError
} from "../../domain/errors.js";

class DeleteTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private tenantAccess: TenantAccess.Interface,
        private listTenants: ListTenantsUseCase.Interface,
        private coreDeleteTenant: CoreDeleteTenantUseCase.Interface
    ) {}

    async canDelete(tenantId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const access = await this.tenantAccess.canManage(tenantId);
        if (access.isFail()) {
            /* No core tenant (e.g. never installed): only the entry is deleted, nothing else is
               touched. The Tenant Manager permission was already checked by canManage. */
            if (access.error instanceof TenantNotFoundError) {
                return Result.ok();
            }
            return access;
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
    dependencies: [TenantAccess, ListTenantsUseCase, CoreDeleteTenantUseCase]
});

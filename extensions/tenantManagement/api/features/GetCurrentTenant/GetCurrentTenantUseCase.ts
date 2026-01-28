import { Result } from "webiny/api";
import { TenantContext } from "webiny/api/tenancy";
import { Tenant } from "../../domain/Tenant.js";
import { GetTenantByIdUseCase } from "../GetTenantById/abstractions.js";
import { GetCurrentTenantUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetCurrentTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private getTenantByIdUseCase: GetTenantByIdUseCase.Interface
    ) {}

    async execute(): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        // Get the current tenant from context
        const currentTenant = this.tenantContext.getTenant();

        // Use the tenant ID to fetch the tenant
        const result = await this.getTenantByIdUseCase.execute(currentTenant.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: GetCurrentTenantUseCase,
    dependencies: [TenantContext, GetTenantByIdUseCase]
});

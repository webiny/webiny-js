import { Tenant } from "~/shared/Tenant.js";
import { GetTenantByIdUseCase } from "../GetTenantById/abstractions.js";
import { GetCurrentTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { Result } from "@webiny/feature/api";

class GetCurrentTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private getTenantByIdUseCase: GetTenantByIdUseCase.Interface
    ) {}

    async execute(): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        // Get the current tenant from context
        const currentTenant = this.tenantContext.getTenant();

        const result = await this.identityContext.withoutAuthorization(() => {
            return this.getTenantByIdUseCase.execute(currentTenant.id);
        });
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: GetCurrentTenantUseCase,
    dependencies: [TenantContext, IdentityContext, GetTenantByIdUseCase]
});

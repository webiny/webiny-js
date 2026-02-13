import { Tenant } from "~/shared/Tenant.js";
import { GetTenantByIdUseCase } from "../GetTenantById/abstractions.js";
import { GetCurrentTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";

class GetCurrentTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private getTenantByIdUseCase: GetTenantByIdUseCase.Interface
    ) {}

    async execute(): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

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

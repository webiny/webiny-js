import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetIdentityProfileUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import { TenantScopes } from "~/features/tenancy/TenantScopes/abstractions.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";

class GetIdentityProfileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private getTenantUseCase: GetTenantByIdUseCase.Interface,
        private tenantScopes: TenantScopes.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(identityId: string): UseCaseAbstraction.Return {
        // Try to get user from the current tenant
        const adminUserResult = await this.repository.get({ id: identityId });

        if (adminUserResult.isOk()) {
            return Result.ok(adminUserResult.value);
        }

        // If not found in current tenant, try parent tenant
        const tenant = this.tenantContext.getTenant();

        if (!tenant.parent) {
            // No parent tenant, return the error
            return Result.fail(adminUserResult.error);
        }

        const parentTenantResult = await this.getTenantUseCase.execute(tenant.parent);

        if (parentTenantResult.isFail()) {
            return Result.fail(adminUserResult.error);
        }

        // The parent tenant's users live in the parent's storage: read them in its scope.
        const parentTenantUserResult = await this.tenantScopes.withTenant(
            parentTenantResult.value,
            async scope => {
                return scope.resolve(AdminUsersRepository).get({ id: identityId });
            }
        );

        if (parentTenantUserResult.isFail()) {
            return Result.fail(parentTenantUserResult.error);
        }

        return Result.ok(parentTenantUserResult.value);
    }
}

export const GetIdentityProfileUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetIdentityProfileUseCaseImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase, TenantScopes, AdminUsersRepository]
});

import { Result } from "@webiny/feature/api";
import type { Tenant } from "~/shared/Tenant.js";
import { TenantAccess } from "../TenantAccess/abstractions.js";
import { ListTenantsRepository, ListTenantsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListTenantsUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private tenantAccess: TenantAccess.Interface,
        private repository: ListTenantsRepository.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<Tenant[], UseCaseAbstraction.Error>> {
        // Listing every tenant is for the identities that manage tenants.
        const access = await this.tenantAccess.canCreate();
        if (access.isFail()) {
            return Result.fail(access.error);
        }

        return this.repository.execute(input);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: ListTenantsUseCase,
    dependencies: [TenantAccess, ListTenantsRepository]
});

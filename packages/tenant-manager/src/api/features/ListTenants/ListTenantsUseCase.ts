import { Result } from "@webiny/feature/api";
import type { Tenant } from "~/shared/Tenant.js";
import { TenantAccess } from "../TenantAccess/abstractions.js";
import { ListTenantsRepository } from "./abstractions.js";
import { ListTenantsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListTenantsUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private tenantAccess: TenantAccess.Interface,
        private repository: ListTenantsRepository.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<Tenant[], UseCaseAbstraction.Error>> {
        const access = await this.tenantAccess.canList();
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

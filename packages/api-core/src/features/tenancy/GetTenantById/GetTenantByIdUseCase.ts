import { createImplementation } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GetTenantByIdUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetTenantByIdRepository } from "./abstractions.js";

class GetTenantByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetTenantByIdRepository.Interface) {}

    async execute(id: string): UseCaseAbstraction.Result {
        const tenant = await this.repository.getById(id);

        if (!tenant) {
            return Result.fail<UseCaseAbstraction.Error>({ type: "NOT_FOUND" });
        }

        return Result.ok(tenant);
    }
}

export const GetTenantByIdUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetTenantByIdUseCaseImpl,
    dependencies: [GetTenantByIdRepository]
});

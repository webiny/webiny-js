import { createImplementation, Result } from "@webiny/feature/api";
import { ListTenantsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListTenantsRepository } from "./abstractions.js";
import type { ListTenantsParams } from "~/types.js";

class ListTenantsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListTenantsRepository.Interface) {}

    async execute(params?: ListTenantsParams) {
        const tenants = await this.repository.list(params);

        return Result.ok(tenants);
    }
}

export const ListTenantsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListTenantsUseCaseImpl,
    dependencies: [ListTenantsRepository]
});

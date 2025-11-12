import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetRevisionByIdUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetRevisionByIdRepository } from "./abstractions.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";

/**
 * GetRevisionByIdUseCase - Fetches a specific entry revision.
 *
 * This is a simple query use case that delegates to the repository.
 */
class GetRevisionByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetRevisionByIdRepository.Interface) {}

    async execute(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry, UseCaseAbstraction.Error>> {
        return this.repository.execute(model, id);
    }
}

export const GetRevisionByIdUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetRevisionByIdUseCaseImpl,
    dependencies: [GetRevisionByIdRepository]
});

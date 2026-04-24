import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetRevisionByIdUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetRevisionByIdRepository } from "./abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

/**
 * GetRevisionByIdUseCase - Fetches a specific entry revision.
 *
 * This is a simple query use case that delegates to the repository.
 */
class GetRevisionByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private repository: GetRevisionByIdRepository.Interface) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        return this.repository.execute<T>(model, id);
    }
}

export const GetRevisionByIdUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetRevisionByIdUseCaseImpl,
    dependencies: [GetRevisionByIdRepository]
});

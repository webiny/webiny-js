import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase as UseCaseAbstraction } from "../abstractions.js";
import { GetLatestRevisionByEntryIdBaseUseCase } from "../abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel, CmsEntryStorageOperationsGetLatestRevisionParams } from "~/types/index.js";

/**
 * Returns any latest revision (deled and non-deleted)
 */
class GetLatestRevisionByEntryIdIncludingDeletedUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private baseUseCase: GetLatestRevisionByEntryIdBaseUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        // Simply delegate to base use case without any filtering
        return await this.baseUseCase.execute<T>(model, params);
    }
}

export const GetLatestRevisionByEntryIdIncludingDeletedUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetLatestRevisionByEntryIdIncludingDeletedUseCaseImpl,
    dependencies: [GetLatestRevisionByEntryIdBaseUseCase]
});

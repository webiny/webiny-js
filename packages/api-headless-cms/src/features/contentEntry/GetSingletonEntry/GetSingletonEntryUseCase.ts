import { Result } from "@webiny/feature/api";
import { GetSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants.js";
import { EntryValidationError } from "~/domain/contentEntry/errors.js";
import { createCacheKey } from "@webiny/utils";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { GetEntryByIdUseCase } from "~/features/contentEntry/GetEntryById/index.js";

/**
 * GetSingletonEntryUseCase - Gets the singleton entry for a model.
 *
 * Responsibilities:
 * - Validate model is marked as singleton
 * - Generate singleton entry ID from model ID
 * - Try to get existing entry
 * - If not found, create a new entry with skipValidators: ["required"]
 * - Delegate to generic GetEntry and CreateEntry use cases
 */
class GetSingletonEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        // Validate model is marked as singleton
        if (!model.tags?.includes(CMS_MODEL_SINGLETON_TAG)) {
            return Result.fail(new EntryValidationError("Model is not marked as singleton."));
        }

        // Generate singleton entry ID from model ID
        const id = createCacheKey(model.modelId);
        const entryId = `${id}#0001`;

        // Try to get existing entry
        const getResult = await this.getEntryById.execute<T>(model, entryId);

        if (getResult.isOk()) {
            return getResult;
        }

        // Entry doesn't exist, create it
        return await this.createEntry.execute<T>(
            model,
            {
                id,
                values: {
                    // safe to cast
                } as T
            },
            { skipValidators: ["required"] }
        );
    }
}

export const GetSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSingletonEntryUseCaseImpl,
    dependencies: [GetEntryByIdUseCase, CreateEntryUseCase]
});

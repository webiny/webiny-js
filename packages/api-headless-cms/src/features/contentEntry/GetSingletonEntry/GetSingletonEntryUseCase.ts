import { Result } from "@webiny/feature/api";
import { GetSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants.js";
import { EntryValidationError } from "~/domain/contentEntry/errors.js";
import { createCacheKey } from "@webiny/utils";
import type { CmsEntry } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
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
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface
    ) {}

    async execute(model: CmsModel): Promise<Result<CmsEntry, UseCaseAbstraction.Error>> {
        // Validate model is marked as singleton
        if (!model.tags?.includes(CMS_MODEL_SINGLETON_TAG)) {
            return Result.fail(new EntryValidationError("Model is not marked as singleton."));
        }

        // Generate singleton entry ID from model ID
        const id = createCacheKey(model.modelId);
        const entryId = `${id}#0001`;

        // Try to get existing entry
        const getResult = await this.getEntryById.execute(model, entryId);

        if (getResult.isOk()) {
            return getResult;
        }

        // Entry doesn't exist, create it
        const createResult = await this.createEntry.execute(
            model,
            { id },
            { skipValidators: ["required"] }
        );

        return createResult;
    }
}

export const GetSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSingletonEntryUseCaseImpl,
    dependencies: [GetEntryByIdUseCase, CreateEntryUseCase]
});

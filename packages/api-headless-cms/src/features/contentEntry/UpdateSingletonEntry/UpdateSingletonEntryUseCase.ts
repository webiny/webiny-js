import { Result } from "@webiny/feature/api";
import { UpdateSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetSingletonEntryUseCase } from "~/features/contentEntry/GetSingletonEntry/index.js";
import type { CmsEntry } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import type { UpdateCmsEntryInput } from "~/types/index.js";
import type { UpdateCmsEntryOptionsInput } from "~/types/index.js";
import { UpdateEntryUseCase } from "../UpdateEntry/abstractions.js";

// This will be the generic entry use case - using 'any' for now as placeholder
// You'll need to import the actual abstraction when it's created
interface UpdateEntryUseCase {
    execute(
        model: CmsModel,
        entryId: string,
        data: UpdateCmsEntryInput,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry, any>>;
}

/**
 * UpdateSingletonEntryUseCase - Updates the singleton entry for a model.
 *
 * Responsibilities:
 * - Get the singleton entry (creating it if it doesn't exist)
 * - Delegate to generic UpdateEntry use case with the entry ID
 */
class UpdateSingletonEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getSingletonEntryUseCase: GetSingletonEntryUseCase.Interface,
        private updateEntryUseCase: UpdateEntryUseCase
    ) {}

    async execute(
        model: CmsModel,
        data: UpdateCmsEntryInput,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry, UseCaseAbstraction.Error>> {
        // Get the singleton entry (create a new one if it doesn't exist)
        const getResult = await this.getSingletonEntryUseCase.execute(model);

        if (getResult.isFail()) {
            return getResult;
        }

        const entry = getResult.value;

        // Update the entry using the regular update use case
        const updateResult = await this.updateEntryUseCase.execute(model, entry.id, data, options);

        return updateResult;
    }
}

export const UpdateSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateSingletonEntryUseCaseImpl,
    dependencies: [GetSingletonEntryUseCase, UpdateEntryUseCase]
});

import { Result } from "@webiny/feature/api";
import { UpdateSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetSingletonEntryUseCase } from "~/features/contentEntry/GetSingletonEntry/index.js";
import type { CmsEntry, CmsEntryValues } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import type { UpdateCmsEntryInput } from "~/types/index.js";
import type { UpdateCmsEntryOptionsInput } from "~/types/index.js";
import { UpdateEntryUseCase } from "../UpdateEntry/abstractions.js";

// This will be the generic entry use case - using 'any' for now as placeholder
// You'll need to import the actual abstraction when it's created
interface UpdateEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entryId: string,
        data: UpdateCmsEntryInput<T>,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, any>>;
}

/**
 * UpdateSingletonEntryUseCase - Updates the singleton entry for a model.
 *
 * Responsibilities:
 * - Get the singleton entry (creating it if it doesn't exist)
 * - Delegate to generic UpdateEntry use case with the entry ID
 */
class UpdateSingletonEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private getSingletonEntryUseCase: GetSingletonEntryUseCase.Interface,
        private updateEntryUseCase: UpdateEntryUseCase
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        data: UpdateCmsEntryInput<T>,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        // Get the singleton entry (create a new one if it doesn't exist)
        const getResult = await this.getSingletonEntryUseCase.execute<T>(model);

        if (getResult.isFail()) {
            return getResult;
        }

        const entry = getResult.value;

        // Update the entry using the regular update use case
        return await this.updateEntryUseCase.execute<T>(model, entry.id, data, options);
    }
}

export const UpdateSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateSingletonEntryUseCaseImpl,
    dependencies: [GetSingletonEntryUseCase, UpdateEntryUseCase]
});

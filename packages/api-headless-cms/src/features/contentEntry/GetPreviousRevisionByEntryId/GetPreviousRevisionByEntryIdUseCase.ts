import { createImplementation, Result } from "@webiny/feature/api";
import { GetPreviousRevisionByEntryIdUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetPreviousRevisionByEntryIdBaseUseCase } from "./abstractions.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetPreviousRevisionParams
} from "~/types/index.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";

/**
 * Returns non-deleted previous revision only.
 *
 * Composes the base use case and filters out deleted entries.
 */
class GetPreviousRevisionByEntryIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private baseUseCase: GetPreviousRevisionByEntryIdBaseUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const result = await this.baseUseCase.execute<T>(model, params);

        if (result.isFail()) {
            return result;
        }

        const entry = result.value;

        // Return error if entry is deleted
        if (entry.wbyDeleted) {
            // TODO: should we be loading revisions till we find one that is not deleted?
            return Result.fail(new EntryNotFoundError(params.entryId));
        }

        return Result.ok(entry);
    }
}

export const GetPreviousRevisionByEntryIdUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetPreviousRevisionByEntryIdUseCaseImpl,
    dependencies: [GetPreviousRevisionByEntryIdBaseUseCase]
});

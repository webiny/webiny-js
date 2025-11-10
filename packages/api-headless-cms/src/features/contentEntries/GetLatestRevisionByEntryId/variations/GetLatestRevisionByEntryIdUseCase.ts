import { createImplementation, Result } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdUseCase as UseCaseAbstraction } from "../abstractions.js";
import { GetLatestRevisionByEntryIdBaseUseCase } from "../abstractions.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetLatestRevisionParams
} from "~/types/index.js";
import { EntryNotFoundError } from "~/domains/contentEntries/errors.js";

/**
 * Returns non-deleted entry only.
 *
 * Composes the base use case and filters out deleted entries.
 */
class GetLatestRevisionByEntryIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private baseUseCase: GetLatestRevisionByEntryIdBaseUseCase.Interface) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const result = await this.baseUseCase.execute<T>(model, params);

        if (result.isFail()) {
            return result;
        }

        const entry = result.value;

        // Return null if entry doesn't exist or is deleted
        if (!entry || entry.wbyDeleted) {
            return Result.fail(new EntryNotFoundError(params.id));
        }

        return Result.ok(entry);
    }
}

export const GetLatestRevisionByEntryIdUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetLatestRevisionByEntryIdUseCaseImpl,
    dependencies: [GetLatestRevisionByEntryIdBaseUseCase]
});

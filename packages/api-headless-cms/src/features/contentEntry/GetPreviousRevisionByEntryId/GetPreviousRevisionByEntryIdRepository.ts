import { Result } from "@webiny/feature/api";
import { GetPreviousRevisionByEntryIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryNotFoundError, EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetPreviousRevisionParams
} from "~/types/index.js";
import { GetPreviousRevisionStorageOperation } from "~/features/shared/storageOperations/entry/GetPreviousRevisionStorageOperation.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";

/**
 * GetPreviousRevisionByEntryIdRepository - Fetches previous revision by entry ID and version from storage.
 * Returns the previous revision for a given entry (includes deleted entries).
 */
class GetPreviousRevisionByEntryIdRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private getPreviousRevisionStorage: GetPreviousRevisionStorageOperation.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ): Promise<Result<CmsEntry<T>, RepositoryAbstraction.Error>> {
        try {
            const entry = await this.getPreviousRevisionStorage.execute<T>(model, params);

            if (!entry) {
                return Result.fail(new EntryNotFoundError(params.entryId));
            }

            // Transform storage entry to domain entry
            const transformedEntry = await this.entryFromStorageTransform(model, entry);

            return Result.ok(transformedEntry);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const GetPreviousRevisionByEntryIdRepository = RepositoryAbstraction.createImplementation({
    implementation: GetPreviousRevisionByEntryIdRepositoryImpl,
    dependencies: [EntryFromStorageTransform, GetPreviousRevisionStorageOperation]
});

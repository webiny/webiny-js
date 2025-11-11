import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetPreviousRevisionByEntryIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryNotFoundError, EntryStorageError } from "~/domains/contentEntries/errors.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetPreviousRevisionParams
} from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";

/**
 * GetPreviousRevisionByEntryIdRepository - Fetches previous revision by entry ID and version from storage.
 * Returns the previous revision for a given entry (includes deleted entries).
 */
class GetPreviousRevisionByEntryIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ): Promise<Result<CmsEntry<T>, RepositoryAbstraction.Error>> {
        try {
            const entry = await this.storageOperations.entries.getPreviousRevision(model, params);

            if (!entry) {
                return Result.fail(new EntryNotFoundError(params.entryId));
            }

            // Transform storage entry to domain entry
            const transformedEntry = await this.entryFromStorageTransform(model, entry);

            return Result.ok(transformedEntry as CmsEntry<T>);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }
}

export const GetPreviousRevisionByEntryIdRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GetPreviousRevisionByEntryIdRepositoryImpl,
    dependencies: [EntryFromStorageTransform, StorageOperations]
});

import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryNotFoundError, EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel, CmsEntryStorageOperationsGetLatestRevisionParams } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";

/**
 * GetLatestRevisionByEntryIdRepository - Fetches latest revision by entry ID from storage.
 * Returns the latest revision for a given entry (includes deleted entries).
 */
class GetLatestRevisionByEntryIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ): Promise<Result<CmsEntry<T>, RepositoryAbstraction.Error>> {
        try {
            const entry = await this.storageOperations.entries.getLatestRevisionByEntryId(model, params);

            if (!entry) {
                return Result.fail(new EntryNotFoundError(params.id));
            }

            // Transform storage entry to domain entry
            const transformedEntry = await this.entryFromStorageTransform(model, entry);

            return Result.ok(transformedEntry as CmsEntry<T>);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const GetLatestRevisionByEntryIdRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GetLatestRevisionByEntryIdRepositoryImpl,
    dependencies: [EntryFromStorageTransform, StorageOperations]
});

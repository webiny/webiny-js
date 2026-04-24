import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetLatestEntriesByIdsRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";

/**
 * GetLatestEntriesByIdsRepository - Fetches latest entries by entry IDs from storage.
 * Returns array of latest entries.
 */
class GetLatestEntriesByIdsRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], RepositoryAbstraction.Error>> {
        try {
            const result = await this.storageOperations.entries.getLatestByIds<T>(model, { ids });

            // Transform storage entries to domain entries
            const items = await Promise.all(
                result.map(async entry => {
                    return this.entryFromStorageTransform(model, entry);
                })
            );

            return Result.ok(items);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const GetLatestEntriesByIdsRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GetLatestEntriesByIdsRepositoryImpl,
    dependencies: [EntryFromStorageTransform, StorageOperations]
});

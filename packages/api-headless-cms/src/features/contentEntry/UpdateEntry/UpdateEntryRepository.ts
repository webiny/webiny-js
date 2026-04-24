import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { UpdateEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";

/**
 * UpdateEntryRepository - Handles persistence of entry updates.
 * Transforms domain entry to storage format and persists changes.
 */
class UpdateEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Transform domain entry to storage format
            const storageEntry = await this.entryToStorageTransform<T>(model, entry);

            // Persist to storage
            await this.storageOperations.entries.update<T>(model, {
                entry,
                storageEntry
            });

            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const UpdateEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: UpdateEntryRepositoryImpl,
    dependencies: [EntryToStorageTransform, StorageOperations]
});

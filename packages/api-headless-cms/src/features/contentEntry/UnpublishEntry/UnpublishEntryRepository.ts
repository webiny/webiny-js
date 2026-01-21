import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { UnpublishEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";

/**
 * UnpublishEntryRepository - Handles persistence of entry unpublish.
 * Transforms domain entry to storage format and persists unpublish operation.
 */
class UnpublishEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<Result<CmsEntry<T>, RepositoryAbstraction.Error>> {
        try {
            // Transform domain entry to storage format
            const storageEntry = await this.entryToStorageTransform<T>(model, entry);

            // Persist unpublish to storage
            const result = await this.storageOperations.entries.unpublish<T>(model, {
                entry,
                storageEntry
            });

            return Result.ok(result);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const UnpublishEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: UnpublishEntryRepositoryImpl,
    dependencies: [EntryToStorageTransform, StorageOperations]
});

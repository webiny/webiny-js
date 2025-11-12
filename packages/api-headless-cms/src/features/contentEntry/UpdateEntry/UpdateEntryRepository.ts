import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { UpdateEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryStorageError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";

/**
 * UpdateEntryRepository - Handles persistence of entry updates.
 * Transforms domain entry to storage format and persists changes.
 */
class UpdateEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute(
        model: CmsModel,
        entry: CmsEntry
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Transform domain entry to storage format
            const storageEntry = await this.entryToStorageTransform(model, entry);

            // Persist to storage
            await this.storageOperations.entries.update(model, {
                entry,
                storageEntry
            });

            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }
}

export const UpdateEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: UpdateEntryRepositoryImpl,
    dependencies: [EntryToStorageTransform, StorageOperations]
});

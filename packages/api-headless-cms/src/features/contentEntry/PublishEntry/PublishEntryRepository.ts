import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { PublishEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";

/**
 * PublishEntryRepository - Handles storage operations for publishing entries.
 *
 * Responsibilities:
 * - Transform entry to storage format
 * - Publish the entry in storage
 * - Transform result back from storage format
 * - Handle storage errors
 */
class PublishEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute(
        model: CmsModel,
        entry: CmsEntry
    ): Promise<Result<CmsEntry, RepositoryAbstraction.Error>> {
        try {
            // Transform entry to storage format
            const storageEntry = await this.entryToStorageTransform(model, entry);

            // Publish the entry
            const result = await this.storageOperations.entries.publish(model, {
                entry,
                storageEntry
            });

            // Transform result back from storage format
            const transformedEntry = await this.entryFromStorageTransform(model, result);

            return Result.ok(transformedEntry);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const PublishEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: PublishEntryRepositoryImpl,
    dependencies: [EntryToStorageTransform, EntryFromStorageTransform, StorageOperations]
});

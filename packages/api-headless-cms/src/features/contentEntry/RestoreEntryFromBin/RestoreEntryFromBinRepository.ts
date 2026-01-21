import { createImplementation, Result } from "@webiny/feature/api";
import { RestoreEntryFromBinRepository as RepositoryAbstraction } from "./abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform, EntryToStorageTransform } from "~/legacy/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";

/**
 * RestoreEntryFromBinRepository - Handles storage operations for restoring entries from bin.
 *
 * Responsibilities:
 * - Transform entry to storage format
 * - Call storage operation to restore entry
 * - Transform result back from storage format
 * - Handle storage errors
 */
class RestoreEntryFromBinRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<Result<CmsEntry<T>, RepositoryAbstraction.Error>> {
        try {
            // Transform entry to storage format
            const storageEntry = await this.entryToStorageTransform<T>(model, entry);

            // Call storage operation
            const result = await this.storageOperations.entries.restoreFromBin<T>(model, {
                entry,
                storageEntry
            });

            // Transform result back from storage format
            const transformedEntry = await this.entryFromStorageTransform<T>(model, result);

            return Result.ok(transformedEntry);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const RestoreEntryFromBinRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: RestoreEntryFromBinRepositoryImpl,
    dependencies: [EntryToStorageTransform, EntryFromStorageTransform, StorageOperations]
});

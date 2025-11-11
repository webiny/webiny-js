import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { RestoreEntryFromBinRepository as RepositoryAbstraction } from "./abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { EntryStorageError } from "~/domains/contentEntries/errors.js";

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

            // Call storage operation
            const result = await this.storageOperations.entries.restoreFromBin(model, {
                entry,
                storageEntry
            });

            // Transform result back from storage format
            const transformedEntry = await this.entryFromStorageTransform(model, result);

            return Result.ok(transformedEntry);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }
}

export const RestoreEntryFromBinRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: RestoreEntryFromBinRepositoryImpl,
    dependencies: [EntryToStorageTransform, EntryFromStorageTransform, StorageOperations]
});

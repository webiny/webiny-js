import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { RepublishEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { EntryStorageError } from "~/domains/contentEntries/errors.js";

/**
 * RepublishEntryRepository - Handles storage operations for republishing entries.
 *
 * Responsibilities:
 * - Transform entry to storage format
 * - Update the entry in storage
 * - Publish the entry in storage
 * - Transform result back from storage format
 * - Handle storage errors
 */
class RepublishEntryRepositoryImpl implements RepositoryAbstraction.Interface {
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

            // First update the entry
            await this.storageOperations.entries.update(model, {
                entry,
                storageEntry
            });

            // Then publish it
            const result = await this.storageOperations.entries.publish(model, {
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

export const RepublishEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: RepublishEntryRepositoryImpl,
    dependencies: [EntryToStorageTransform, EntryFromStorageTransform, StorageOperations]
});

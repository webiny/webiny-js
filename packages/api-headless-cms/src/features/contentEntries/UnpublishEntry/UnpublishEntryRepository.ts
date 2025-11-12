import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { UnpublishEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryStorageError } from "~/domains/contentEntries/errors.js";
import type { CmsEntry } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";

/**
 * UnpublishEntryRepository - Handles persistence of entry unpublish.
 * Transforms domain entry to storage format and persists unpublish operation.
 */
class UnpublishEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute(
        model: CmsModel,
        entry: CmsEntry
    ): Promise<Result<CmsEntry, RepositoryAbstraction.Error>> {
        try {
            // Transform domain entry to storage format
            const storageEntry = await this.entryToStorageTransform(model, entry);

            // Persist unpublish to storage
            const result = await this.storageOperations.entries.unpublish(model, {
                entry,
                storageEntry
            });

            return Result.ok(result);
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }
}

export const UnpublishEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: UnpublishEntryRepositoryImpl,
    dependencies: [EntryToStorageTransform, StorageOperations]
});

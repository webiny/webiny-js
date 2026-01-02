import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { DeleteEntryRevisionRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";
import { isEntryLevelEntryMetaField, pickEntryMetaFields } from "~/constants.js";

/**
 * DeleteEntryRevisionRepository - Handles storage operations for deleting entry revisions.
 */
class DeleteEntryRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute(params: {
        model: CmsModel;
        entry: CmsEntry;
        latestEntry: CmsEntry | null;
    }): Promise<Result<void, RepositoryAbstraction.Error>> {
        const { model, entry, latestEntry } = params;

        try {
            const storageEntry = await this.entryToStorageTransform(model, entry);

            let storageLatestEntry = null;
            if (latestEntry) {
                // Pick entry-level meta fields from the deleted entry to update the new latest
                const pickedEntryLevelMetaFields = pickEntryMetaFields(
                    entry,
                    isEntryLevelEntryMetaField
                );

                const updatedLatestEntry = {
                    ...latestEntry,
                    ...pickedEntryLevelMetaFields
                };

                storageLatestEntry = await this.entryToStorageTransform(model, updatedLatestEntry);
            }

            await this.storageOperations.entries.deleteRevision(model, {
                entry,
                storageEntry,
                latestEntry: latestEntry,
                latestStorageEntry: storageLatestEntry
            });

            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const DeleteEntryRevisionRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: DeleteEntryRevisionRepositoryImpl,
    dependencies: [EntryToStorageTransform, StorageOperations]
});

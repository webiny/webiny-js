import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { RepublishEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import { RuntimeTenant } from "~/features/runtimeTenant/abstractions.js";

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
    public constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface,
        private runtimeTenant: RuntimeTenant.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        initialEntry: CmsEntry<T>
    ): Promise<Result<CmsEntry<T>, RepositoryAbstraction.Error>> {
        const model = this.runtimeTenant.assign(initialModel);
        const entry = this.runtimeTenant.assign(initialEntry);

        try {
            // Transform entry to storage format
            const storageEntry = await this.entryToStorageTransform<T>(model, entry);

            // First update the entry
            await this.storageOperations.entries.update(model, {
                entry,
                storageEntry
            });

            // Then publish it
            const result = await this.storageOperations.entries.publish<T>(model, {
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

export const RepublishEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: RepublishEntryRepositoryImpl,
    dependencies: [
        EntryToStorageTransform,
        EntryFromStorageTransform,
        StorageOperations,
        RuntimeTenant
    ]
});

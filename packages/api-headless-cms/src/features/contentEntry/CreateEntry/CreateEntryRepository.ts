import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { CreateEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";
import { RuntimeTenant } from "~/features/runtimeTenant/abstractions.js";

/**
 * CreateEntryRepository - Handles persistence of new entries.
 * Transforms domain entry to storage format and persists it.
 */
class CreateEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface,
        private runtimeTenant: RuntimeTenant.Interface
    ) {}

    public async execute(
        initialModel: CmsModel,
        initialEntry: CmsEntry
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        const model = this.runtimeTenant.assign(initialModel);
        const entry = this.runtimeTenant.assign(initialEntry);

        try {
            // Transform domain entry to storage format
            const storageEntry = await this.entryToStorageTransform(model, entry);

            // Persist to storage
            await this.storageOperations.entries.create(model, {
                entry,
                storageEntry
            });

            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const CreateEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: CreateEntryRepositoryImpl,
    dependencies: [EntryToStorageTransform, StorageOperations, RuntimeTenant]
});

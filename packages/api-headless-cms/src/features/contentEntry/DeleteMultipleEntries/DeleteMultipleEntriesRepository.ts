import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { DeleteMultipleEntriesRepository as RepositoryAbstraction } from "./abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import { RuntimeTenant } from "~/features/runtimeTenant/abstractions.js";

/**
 * DeleteMultipleEntriesRepository - Handles storage operations for deleting multiple entries.
 *
 * Responsibilities:
 * - Call storage operation to delete multiple entries
 * - Handle storage errors
 */
class DeleteMultipleEntriesRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private storageOperations: StorageOperations.Interface,
        private runtimeTenant: RuntimeTenant.Interface
    ) {}

    async execute(
        initialModel: CmsModel,
        entryIds: string[]
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const model = this.runtimeTenant.assign(initialModel);
            await this.storageOperations.entries.deleteMultipleEntries(model, {
                entries: entryIds
            });
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const DeleteMultipleEntriesRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: DeleteMultipleEntriesRepositoryImpl,
    dependencies: [StorageOperations, RuntimeTenant]
});

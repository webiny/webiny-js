import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { DeleteMultipleEntriesRepository as RepositoryAbstraction } from "./abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";

/**
 * DeleteMultipleEntriesRepository - Handles storage operations for deleting multiple entries.
 *
 * Responsibilities:
 * - Call storage operation to delete multiple entries
 * - Handle storage errors
 */
class DeleteMultipleEntriesRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(private storageOperations: StorageOperations.Interface) {}

    async execute(
        model: CmsModel,
        entryIds: string[]
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
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
    dependencies: [StorageOperations]
});

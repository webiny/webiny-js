import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { DeleteEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryStorageError } from "~/domains/contentEntries/errors.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";

/**
 * DeleteEntryRepository - Handles storage operations for permanently deleting entries.
 */
class DeleteEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private storageOperations: StorageOperations.Interface) {}

    async execute(
        model: CmsModel,
        entry: CmsEntry
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.entries.delete(model, { entry });
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }
}

export const DeleteEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: DeleteEntryRepositoryImpl,
    dependencies: [StorageOperations]
});

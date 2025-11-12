import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { MoveEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { EntryStorageError } from "~/domain/contentEntry/errors.js";

/**
 * MoveEntryRepository - Handles storage operations for moving entries.
 *
 * Responsibilities:
 * - Call storage operation to move entry to different folder
 * - Handle storage errors
 */
class MoveEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private storageOperations: StorageOperations.Interface) {}

    async execute(
        model: CmsModel,
        id: string,
        folderId: string
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.entries.move(model, id, folderId);
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryStorageError(error as Error));
        }
    }
}

export const MoveEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: MoveEntryRepositoryImpl,
    dependencies: [StorageOperations]
});

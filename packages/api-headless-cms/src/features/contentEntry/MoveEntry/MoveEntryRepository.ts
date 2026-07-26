import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { MoveEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    MoveEntryStorageOperation
} from "~/features/shared/storageOperations/entry/MoveEntryStorageOperation.js";
import type { CmsModel } from "~/types/index.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";

/**
 * MoveEntryRepository - Handles storage operations for moving entries.
 *
 * Responsibilities:
 * - Call storage operation to move entry to different folder
 * - Handle storage errors
 */
class MoveEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(private moveEntryStorage: MoveEntryStorageOperation.Interface) {}

    async execute(
        model: CmsModel,
        id: string,
        folderId: string
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.moveEntryStorage.execute(model, id, folderId);
            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const MoveEntryRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: MoveEntryRepositoryImpl,
    dependencies: [MoveEntryStorageOperation]
});

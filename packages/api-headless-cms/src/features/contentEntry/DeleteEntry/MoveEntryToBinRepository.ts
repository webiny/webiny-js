import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { MoveEntryToBinRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";

/**
 * MoveEntryToBinRepository - Handles storage operations for soft deleting entries.
 */
class MoveEntryToBinRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute(params: {
        model: CmsModel;
        entry: CmsEntry;
    }): Promise<Result<void, RepositoryAbstraction.Error>> {
        const { model, entry } = params;

        try {
            const storageEntry = await this.entryToStorageTransform(model, entry);

            await this.storageOperations.entries.moveToBin(model, {
                entry,
                storageEntry
            });

            return Result.ok();
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const MoveEntryToBinRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: MoveEntryToBinRepositoryImpl,
    dependencies: [EntryToStorageTransform, StorageOperations]
});

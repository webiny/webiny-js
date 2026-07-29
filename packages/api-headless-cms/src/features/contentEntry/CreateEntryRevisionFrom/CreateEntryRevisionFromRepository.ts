import { Result } from "@webiny/feature/api";
import { CreateEntryRevisionFromRepository as RepositoryAbstraction } from "./abstractions.js";
import { CreateEntryRevisionFromStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { EntryToStorageTransform } from "~/legacy/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";

/**
 * CreateEntryRevisionFromRepository - Handles storage operations for creating entry revisions.
 *
 * Responsibilities:
 * - Transform entry to storage format
 * - Call storage operation to create revision
 * - Transform result back from storage format
 * - Handle storage errors
 */
class CreateEntryRevisionFromRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryToStorageTransform: EntryToStorageTransform.Interface,
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private createEntryRevisionFromStorage: CreateEntryRevisionFromStorageOperation.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<Result<CmsEntry<T>, RepositoryAbstraction.Error>> {
        try {
            // Transform entry to storage format
            const storageEntry = await this.entryToStorageTransform<T>(model, entry);

            // Call storage operation
            const result = await this.createEntryRevisionFromStorage.execute(model, {
                entry,
                storageEntry
            });

            // Transform result back from storage format
            const transformedEntry = await this.entryFromStorageTransform(model, result);

            return Result.ok(transformedEntry);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const CreateEntryRevisionFromRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateEntryRevisionFromRepositoryImpl,
    dependencies: [
        EntryToStorageTransform,
        EntryFromStorageTransform,
        CreateEntryRevisionFromStorageOperation
    ]
});

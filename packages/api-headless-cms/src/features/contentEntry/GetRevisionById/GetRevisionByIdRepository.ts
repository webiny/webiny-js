import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetRevisionByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError, EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";

/**
 * GetRevisionByIdRepository - Fetches entry revision from storage and transforms it.
 * Returns entry or fails with EntryNotFoundError if not found.
 */
class GetRevisionByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, RepositoryAbstraction.Error>> {
        try {
            // Fetch from storage
            const storageEntry = await this.storageOperations.entries.getRevisionById<T>(model, {
                id
            });

            if (!storageEntry) {
                return Result.fail(new EntryNotFoundError(id));
            }

            // Transform storage entry to domain entry
            const entry = await this.entryFromStorageTransform<T>(model, storageEntry);

            return Result.ok(entry);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const GetRevisionByIdRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GetRevisionByIdRepositoryImpl,
    dependencies: [EntryFromStorageTransform, StorageOperations]
});

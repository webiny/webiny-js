import { createImplementation, Result } from "@webiny/feature/api";
import { GetPublishedRevisionByEntryIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryNotFoundError, EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";

/**
 * GetPublishedRevisionByEntryIdRepository - Fetches published revision from storage.
 * Returns null if entry not found or is deleted.
 */
class GetPublishedRevisionByEntryIdRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T>, RepositoryAbstraction.Error>> {
        try {
            // Get published revision from storage
            const storageEntry =
                await this.storageOperations.entries.getPublishedRevisionByEntryId<T>(model, {
                    id: entryId
                });

            if (!storageEntry || storageEntry.wbyDeleted) {
                return Result.fail(new EntryNotFoundError(entryId));
            }

            // Transform storage entry to domain entry
            const entry = await this.entryFromStorageTransform(model, storageEntry);

            return Result.ok(entry);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const GetPublishedRevisionByEntryIdRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GetPublishedRevisionByEntryIdRepositoryImpl,
    dependencies: [EntryFromStorageTransform, StorageOperations]
});

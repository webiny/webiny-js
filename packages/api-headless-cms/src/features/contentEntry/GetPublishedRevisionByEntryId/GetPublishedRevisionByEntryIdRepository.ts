import { createImplementation, Result } from "@webiny/feature/api";
import { GetPublishedRevisionByEntryIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryNotFoundError, EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";

/**
 * GetPublishedRevisionByEntryIdRepository - Fetches published revision from storage.
 * Returns null if entry not found or is deleted.
 */
class GetPublishedRevisionByEntryIdRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private getPublishedRevisionByEntryIdStorage: GetPublishedRevisionByEntryIdStorageOperation.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T>, RepositoryAbstraction.Error>> {
        try {
            // Get published revision from storage
            const storageEntry =
                await this.getPublishedRevisionByEntryIdStorage.execute<T>(model, {
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
    dependencies: [EntryFromStorageTransform, GetPublishedRevisionByEntryIdStorageOperation]
});

import { Result } from "@webiny/feature/api";
import { GetPublishedEntriesByIdsRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { GetPublishedEntriesByIdsStorageOperation } from "~/features/shared/storageOperations/entry/GetPublishedEntriesByIdsStorageOperation.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import { RuntimeTenant } from "~/features/runtimeTenant/abstractions.js";

/**
 * GetPublishedEntriesByIdsRepository - Fetches published entries by entry IDs from storage.
 * Returns array of published entries.
 */
class GetPublishedEntriesByIdsRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private getPublishedEntriesByIdsStorage: GetPublishedEntriesByIdsStorageOperation.Interface,
        private runtimeTenant: RuntimeTenant.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        initialModel: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], RepositoryAbstraction.Error>> {
        const model = this.runtimeTenant.assign(initialModel);

        try {
            const result = await this.getPublishedEntriesByIdsStorage.execute<T>(model, {
                ids
            });

            // Transform storage entries to domain entries
            const items = await Promise.all(
                result.map(async entry => {
                    return this.entryFromStorageTransform(model, entry);
                })
            );

            return Result.ok(items);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const GetPublishedEntriesByIdsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetPublishedEntriesByIdsRepositoryImpl,
    dependencies: [
        EntryFromStorageTransform,
        GetPublishedEntriesByIdsStorageOperation,
        RuntimeTenant
    ]
});

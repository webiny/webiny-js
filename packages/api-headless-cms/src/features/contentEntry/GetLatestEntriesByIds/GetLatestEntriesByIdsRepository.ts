import { Result } from "@webiny/feature/api";
import { GetLatestEntriesByIdsRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { GetLatestEntriesByIdsStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestEntriesByIdsStorageOperation.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import { RuntimeTenant } from "~/features/runtimeTenant/abstractions.js";

/**
 * GetLatestEntriesByIdsRepository - Fetches latest entries by entry IDs from storage.
 * Returns array of latest entries.
 */
class GetLatestEntriesByIdsRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private getLatestEntriesByIdsStorage: GetLatestEntriesByIdsStorageOperation.Interface,
        private runtimeTenant: RuntimeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        initialModel: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], RepositoryAbstraction.Error>> {
        const model = this.runtimeTenant.assign(initialModel);

        try {
            const result = await this.getLatestEntriesByIdsStorage.execute<T>(model, { ids });

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

export const GetLatestEntriesByIdsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetLatestEntriesByIdsRepositoryImpl,
    dependencies: [EntryFromStorageTransform, GetLatestEntriesByIdsStorageOperation, RuntimeTenant]
});

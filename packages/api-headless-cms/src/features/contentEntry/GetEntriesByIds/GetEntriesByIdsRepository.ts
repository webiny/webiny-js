import { Result } from "@webiny/feature/api";
import { GetEntriesByIdsRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { GetEntriesByIdsStorageOperation } from "~/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.js";
import { EntryFromStorageTransform } from "~/legacy/abstractions.js";
import { RuntimeTenant } from "~/features/runtimeTenant/abstractions.js";

/**
 * GetEntriesByIdsRepository - Fetches entries by IDs from storage and transforms them.
 * Returns array of entries.
 */
class GetEntriesByIdsRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private getEntriesByIdsStorage: GetEntriesByIdsStorageOperation.Interface,
        private runtimeTenant: RuntimeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        initialModel: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], RepositoryAbstraction.Error>> {
        const model = this.runtimeTenant.assign(initialModel);

        try {
            const result = await this.getEntriesByIdsStorage.execute<T>(model, {
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

export const GetEntriesByIdsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetEntriesByIdsRepositoryImpl,
    dependencies: [EntryFromStorageTransform, GetEntriesByIdsStorageOperation, RuntimeTenant]
});

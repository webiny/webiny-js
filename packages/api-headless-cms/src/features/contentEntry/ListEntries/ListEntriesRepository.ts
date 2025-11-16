import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { ListEntriesRepository as RepositoryAbstraction } from "./abstractions.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type {
    CmsEntry,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsEntryStorageOperationsListParams,
    CmsEntryValues,
    CmsModel
} from "~/types/index.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform, SearchableFieldsProvider } from "~/legacy/abstractions.js";

/**
 * ListEntriesRepository - Fetches entries from storage and transforms them.
 * Returns entries with pagination metadata.
 */
class ListEntriesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private searchableFieldsProvider: SearchableFieldsProvider.Interface,
        private entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private storageOperations: StorageOperations.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryListParams
    ): Promise<Result<[CmsEntry<T>[], CmsEntryMeta], RepositoryAbstraction.Error>> {
        try {
            const limit = params.limit && params.limit > 0 ? params.limit : 50;
            const listParams: CmsEntryStorageOperationsListParams = {
                ...params,
                limit,
                where: { ...params.where },
                fields: this.searchableFieldsProvider({ fields: model.fields })
            };

            const result = await this.storageOperations.entries.list(model, listParams);

            // Transform storage entries to domain entries
            const items = await Promise.all(
                result.items.map(async entry => {
                    return this.entryFromStorageTransform(model, entry);
                })
            );

            const meta: CmsEntryMeta = {
                hasMoreItems: result.hasMoreItems,
                totalCount: result.totalCount,
                cursor: result.hasMoreItems ? result.cursor : null
            };

            return Result.ok([items as CmsEntry<T>[], meta]);
        } catch (error) {
            return Result.fail(new EntryPersistenceError(error as Error));
        }
    }
}

export const ListEntriesRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: ListEntriesRepositoryImpl,
    dependencies: [SearchableFieldsProvider, EntryFromStorageTransform, StorageOperations]
});

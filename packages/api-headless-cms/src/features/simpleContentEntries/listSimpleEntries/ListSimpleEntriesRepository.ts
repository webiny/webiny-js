import { Result } from "@webiny/feature/api";
import { ListEntriesStorageOperation } from "~/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { EntryFromStorageTransform, SearchableFieldsProvider } from "~/legacy/abstractions.js";
import { assertSimpleModel } from "~/features/simpleContentEntries/domain/assertSimpleModel.js";
import { SimpleEntryPersistenceError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type {
    IListSimpleEntriesParams,
    IListSimpleEntriesResult,
    ISimpleCmsEntry
} from "~/features/simpleContentEntries/types.js";
import type {
    CmsEntryListSort,
    CmsEntryListWhere,
    CmsEntryStorageOperationsListParams,
    CmsEntryValues,
    CmsModel
} from "~/types/index.js";
import { ListSimpleEntriesRepository as RepositoryAbstraction } from "./abstractions/index.js";

const DEFAULT_LIMIT = 50;

/*
 * `createdOn` is one of the eleven fields a simple entry carries, so it is safe to sort on. A
 * dropped meta field would not be, since a simple model gets its own index in which those fields
 * are unmapped.
 */
const DEFAULT_SORT = ["createdOn_DESC"];

class ListSimpleEntriesRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private readonly searchableFieldsProvider: SearchableFieldsProvider.Interface,
        private readonly entryFromStorageTransform: EntryFromStorageTransform.Interface,
        private readonly listEntriesStorage: ListEntriesStorageOperation.Interface
    ) {}

    public async execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: IListSimpleEntriesParams
    ): Promise<Result<IListSimpleEntriesResult<TValues>, RepositoryAbstraction.Error>> {
        assertSimpleModel(model);

        try {
            const limit = params.limit && params.limit > 0 ? params.limit : DEFAULT_LIMIT;

            const listParams: CmsEntryStorageOperationsListParams = {
                after: params.after,
                limit,
                sort: (params.sort ?? DEFAULT_SORT) as CmsEntryListSort,
                where: (params.where ?? {}) as CmsEntryListWhere,
                fields: this.searchableFieldsProvider({ fields: model.fields })
            };

            const result = await this.listEntriesStorage.execute<TValues>(model, listParams);

            const items = await Promise.all(
                result.items.map(async entry => {
                    const transformed = await this.entryFromStorageTransform(model, entry);
                    return transformed as unknown as ISimpleCmsEntry<TValues>;
                })
            );

            return Result.ok({
                items,
                meta: {
                    hasMoreItems: result.hasMoreItems,
                    totalCount: result.totalCount,
                    cursor: result.hasMoreItems ? result.cursor : null
                }
            });
        } catch (error) {
            return Result.fail(new SimpleEntryPersistenceError(error as Error));
        }
    }
}

export const ListSimpleEntriesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListSimpleEntriesRepositoryImpl,
    dependencies: [SearchableFieldsProvider, EntryFromStorageTransform, ListEntriesStorageOperation]
});

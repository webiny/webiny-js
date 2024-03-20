import { IListEntriesOperation, IListEntries } from "~/crud/contentEntry/abstractions";
import { CmsEntry, CmsEntryListParams, CmsEntryMeta, CmsEntryValues, CmsModel } from "~/types";
import WebinyError from "@webiny/error";

export class ListEntries implements IListEntries {
    private listEntries: IListEntriesOperation;

    constructor(listEntries: IListEntriesOperation) {
        this.listEntries = listEntries;
    }

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
        const { where: initialWhere, limit: initialLimit, fields } = params || {};

        try {
            const limit = initialLimit && initialLimit > 0 ? initialLimit : 50;
            const where = { ...initialWhere };
            const listParams = { ...params, where, limit };

            const { hasMoreItems, totalCount, cursor, items } = await this.listEntries.execute(
                model,
                listParams
            );

            const meta = {
                hasMoreItems,
                totalCount,
                /**
                 * Cursor should be null if there are no more items to load.
                 * Just make sure of that, disregarding what is returned from the storageOperations.entries.list method.
                 */
                cursor: hasMoreItems ? cursor : null
            };

            return [items as CmsEntry<T>[], meta];
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Error while fetching entries from storage.",
                ex.code || "LIST_ENTRIES_ERROR",
                {
                    ...ex.data,
                    params,
                    error: {
                        message: ex.message,
                        code: ex.code,
                        data: ex.data
                    },
                    model,
                    fields
                }
            );
        }
    }
}

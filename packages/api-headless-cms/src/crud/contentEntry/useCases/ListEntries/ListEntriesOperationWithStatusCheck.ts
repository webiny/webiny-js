import WebinyError from "@webiny/error";
import { IListEntriesOperation } from "../../adstractions";
import { CmsEntryStorageOperationsListParams, CmsModel } from "~/types";

export class ListEntriesOperationWithStatusCheck implements IListEntriesOperation {
    private listEntries: IListEntriesOperation;

    constructor(listEntries: IListEntriesOperation) {
        this.listEntries = listEntries;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsListParams) {
        const { where } = params;

        /**
         * Where must contain either latest or published keys.
         * We cannot list entries without one of those
         */
        if (where.latest && where.published) {
            throw new WebinyError(
                "Cannot list entries that are both published and latest.",
                "LIST_ENTRIES_ERROR",
                {
                    where
                }
            );
        } else if (!where.latest && !where.published) {
            throw new WebinyError(
                "Cannot list entries if we do not have latest or published defined.",
                "LIST_ENTRIES_ERROR",
                {
                    where
                }
            );
        }

        return await this.listEntries.execute(model, params);
    }
}

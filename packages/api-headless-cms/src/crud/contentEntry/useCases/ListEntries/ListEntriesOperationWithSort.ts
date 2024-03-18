import { IListEntriesOperation } from "../../adstractions";
import { CmsEntryListSort, CmsEntryStorageOperationsListParams, CmsModel } from "~/types";

export class ListEntriesOperationWithSort implements IListEntriesOperation {
    private listEntries: IListEntriesOperation;

    constructor(listEntries: IListEntriesOperation) {
        this.listEntries = listEntries;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsListParams) {
        return await this.listEntries.execute(model, {
            ...params,
            sort: this.createSort(params.sort)
        });
    }

    private createSort(sort?: CmsEntryListSort): CmsEntryListSort {
        if (Array.isArray(sort) && sort.filter(Boolean).length > 0) {
            return sort;
        }

        return ["revisionCreatedOn_DESC"];
    }
}

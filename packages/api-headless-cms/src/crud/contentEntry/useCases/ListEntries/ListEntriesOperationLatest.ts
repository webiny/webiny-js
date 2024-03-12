import { IListEntriesOperation } from "../../adstractions";
import { CmsEntryStorageOperationsListParams, CmsModel } from "~/types";

export class ListEntriesOperationLatest implements IListEntriesOperation {
    private listEntries: IListEntriesOperation;

    constructor(listEntries: IListEntriesOperation) {
        this.listEntries = listEntries;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsListParams) {
        const where = { ...params.where, latest: true };

        return await this.listEntries.execute(model, {
            sort: ["createdOn_DESC"],
            ...params,
            where
        });
    }
}

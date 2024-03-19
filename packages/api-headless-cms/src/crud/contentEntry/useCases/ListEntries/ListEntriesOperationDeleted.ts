import { IListEntriesOperation } from "../../abstractions";
import { CmsEntryStorageOperationsListParams, CmsModel } from "~/types";

export class ListEntriesOperationDeleted implements IListEntriesOperation {
    private listEntries: IListEntriesOperation;

    constructor(listEntries: IListEntriesOperation) {
        this.listEntries = listEntries;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsListParams) {
        const where = { ...params.where, deleted: true };

        return await this.listEntries.execute(model, {
            ...params,
            where
        });
    }
}

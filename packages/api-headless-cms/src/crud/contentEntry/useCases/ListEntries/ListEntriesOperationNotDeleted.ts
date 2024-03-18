import { IListEntriesOperation } from "../../adstractions";
import { CmsEntryStorageOperationsListParams, CmsModel } from "~/types";

export class ListEntriesOperationNotDeleted implements IListEntriesOperation {
    private listEntries: IListEntriesOperation;

    constructor(listEntries: IListEntriesOperation) {
        this.listEntries = listEntries;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsListParams) {
        const where = { ...params.where, deleted_not: true };

        return await this.listEntries.execute(model, {
            ...params,
            where
        });
    }
}

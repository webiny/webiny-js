import { IListEntriesOperation } from "../../abstractions";
import { CmsEntryStorageOperationsListParams, CmsModel } from "~/types";

export class ListEntriesOperationWithSearchableFields implements IListEntriesOperation {
    private readonly listEntries: IListEntriesOperation;

    constructor(listEntries: IListEntriesOperation) {
        this.listEntries = listEntries;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsListParams) {
        return await this.listEntries.execute(model, { ...params });
    }
}

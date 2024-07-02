import { IListEntriesOperation } from "../../abstractions";
import { CmsEntryStorageOperations, CmsEntryStorageOperationsListParams, CmsModel } from "~/types";

export class ListEntriesOperation implements IListEntriesOperation {
    private operation: CmsEntryStorageOperations["list"];

    constructor(operation: CmsEntryStorageOperations["list"]) {
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsListParams) {
        return await this.operation(model, params);
    }
}

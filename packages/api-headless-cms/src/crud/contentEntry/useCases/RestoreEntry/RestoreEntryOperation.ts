import { IRestoreEntryOperation } from "~/crud/contentEntry/abstractions";
import {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsRestoreParams,
    CmsModel
} from "~/types";

export class RestoreEntryOperation implements IRestoreEntryOperation {
    private operation: CmsEntryStorageOperations["restore"];

    constructor(operation: CmsEntryStorageOperations["restore"]) {
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsRestoreParams) {
        await this.operation(model, params);
    }
}

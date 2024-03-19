import { IDeleteEntryOperation } from "../../abstractions";
import {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsDeleteParams,
    CmsModel
} from "~/types";

export class DeleteEntryOperation implements IDeleteEntryOperation {
    private operation: CmsEntryStorageOperations["delete"];

    constructor(operation: CmsEntryStorageOperations["delete"]) {
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteParams) {
        await this.operation(model, params);
    }
}

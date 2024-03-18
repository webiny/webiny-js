import { IGetEntriesByIds } from "../../adstractions";
import {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetByIdsParams,
    CmsModel
} from "~/types";

export class GetEntriesByIds implements IGetEntriesByIds {
    private operation: CmsEntryStorageOperations["getByIds"];

    constructor(operation: CmsEntryStorageOperations["getByIds"]) {
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetByIdsParams) {
        return await this.operation(model, params);
    }
}

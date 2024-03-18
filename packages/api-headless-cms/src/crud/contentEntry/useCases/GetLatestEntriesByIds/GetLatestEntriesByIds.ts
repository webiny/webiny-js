import { IGetLatestEntriesByIds } from "../../adstractions";
import {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetLatestByIdsParams,
    CmsModel
} from "~/types";

export class GetLatestEntriesByIds implements IGetLatestEntriesByIds {
    private operation: CmsEntryStorageOperations["getLatestByIds"];

    constructor(operation: CmsEntryStorageOperations["getLatestByIds"]) {
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetLatestByIdsParams) {
        return await this.operation(model, params);
    }
}

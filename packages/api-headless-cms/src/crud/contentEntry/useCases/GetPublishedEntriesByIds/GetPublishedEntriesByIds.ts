import { IGetPublishedEntriesByIds } from "../../adstractions";
import {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetPublishedByIdsParams,
    CmsModel
} from "~/types";

export class GetPublishedEntriesByIds implements IGetPublishedEntriesByIds {
    private operation: CmsEntryStorageOperations["getPublishedByIds"];

    constructor(operation: CmsEntryStorageOperations["getPublishedByIds"]) {
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetPublishedByIdsParams) {
        return await this.operation(model, params);
    }
}

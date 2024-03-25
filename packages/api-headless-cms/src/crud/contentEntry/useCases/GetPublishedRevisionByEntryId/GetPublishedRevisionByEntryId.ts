import { IGetPublishedRevisionByEntryId } from "../../abstractions";
import {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetPublishedRevisionParams,
    CmsModel
} from "~/types";

export class GetPublishedRevisionByEntryId implements IGetPublishedRevisionByEntryId {
    private operation: CmsEntryStorageOperations["getPublishedRevisionByEntryId"];

    constructor(operation: CmsEntryStorageOperations["getPublishedRevisionByEntryId"]) {
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetPublishedRevisionParams) {
        return await this.operation(model, params);
    }
}

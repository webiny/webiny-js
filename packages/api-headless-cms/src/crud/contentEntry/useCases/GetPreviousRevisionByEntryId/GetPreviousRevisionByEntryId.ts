import { IGetPreviousRevisionByEntryId } from "../../abstractions";
import {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetPreviousRevisionParams,
    CmsModel
} from "~/types";

export class GetPreviousRevisionByEntryId implements IGetPreviousRevisionByEntryId {
    private operation: CmsEntryStorageOperations["getPreviousRevision"];

    constructor(operation: CmsEntryStorageOperations["getPreviousRevision"]) {
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetPreviousRevisionParams) {
        return await this.operation(model, params);
    }
}

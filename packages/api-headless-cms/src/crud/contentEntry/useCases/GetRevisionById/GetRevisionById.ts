import { IGetRevisionById } from "../../abstractions";
import {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetRevisionParams,
    CmsModel
} from "~/types";

export class GetRevisionById implements IGetRevisionById {
    private operation: CmsEntryStorageOperations["getRevisionById"];

    constructor(operation: CmsEntryStorageOperations["getRevisionById"]) {
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetRevisionParams) {
        return await this.operation(model, params);
    }
}

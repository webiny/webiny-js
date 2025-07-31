import type { IGetPublishedRevisionByEntryId } from "../../abstractions";
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetPublishedRevisionParams,
    CmsModel
} from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

export class GetPublishedRevisionByEntryId implements IGetPublishedRevisionByEntryId {
    private readonly operation: CmsEntryStorageOperations["getPublishedRevisionByEntryId"];
    private readonly transform: ITransformEntryCallable;

    constructor(
        operation: CmsEntryStorageOperations["getPublishedRevisionByEntryId"],
        transform: ITransformEntryCallable
    ) {
        this.operation = operation;
        this.transform = transform;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetPublishedRevisionParams) {
        const entry = await this.operation(model, params);

        if (!entry) {
            return null;
        }
        return await this.transform(model, entry);
    }
}

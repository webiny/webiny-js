import type { IGetPreviousRevisionByEntryId } from "../../abstractions";
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetPreviousRevisionParams,
    CmsModel
} from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

export class GetPreviousRevisionByEntryId implements IGetPreviousRevisionByEntryId {
    private readonly operation: CmsEntryStorageOperations["getPreviousRevision"];
    private readonly transform: ITransformEntryCallable;

    public constructor(
        operation: CmsEntryStorageOperations["getPreviousRevision"],
        transform: ITransformEntryCallable
    ) {
        this.operation = operation;
        this.transform = transform;
    }

    public async execute(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ) {
        const entry = await this.operation(model, params);

        if (!entry) {
            return null;
        }
        return await this.transform(model, entry);
    }
}

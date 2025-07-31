import type { IGetLatestRevisionByEntryId } from "../../abstractions";
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetLatestRevisionParams,
    CmsModel
} from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

export class GetLatestRevisionByEntryId implements IGetLatestRevisionByEntryId {
    private readonly operation: CmsEntryStorageOperations["getLatestRevisionByEntryId"];
    private readonly transform: ITransformEntryCallable;

    public constructor(
        operation: CmsEntryStorageOperations["getLatestRevisionByEntryId"],
        transform: ITransformEntryCallable
    ) {
        this.operation = operation;
        this.transform = transform;
    }

    public async execute(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) {
        const entry = await this.operation(model, params);

        if (!entry) {
            return null;
        }
        return this.transform(model, entry);
    }
}

import type { IGetRevisionsByEntryId } from "../../abstractions";
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetRevisionParams,
    CmsModel
} from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

export class GetRevisionsByEntryId implements IGetRevisionsByEntryId {
    private readonly operation: CmsEntryStorageOperations["getRevisions"];
    private readonly transform: ITransformEntryCallable;

    public constructor(
        operation: CmsEntryStorageOperations["getRevisions"],
        transform: ITransformEntryCallable
    ) {
        this.operation = operation;
        this.transform = transform;
    }

    public async execute(model: CmsModel, params: CmsEntryStorageOperationsGetRevisionParams) {
        const result = await this.operation(model, params);

        return await Promise.all(
            result.map(async entry => {
                return await this.transform(model, entry);
            })
        );
    }
}

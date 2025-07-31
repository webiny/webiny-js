import type { IGetPublishedEntriesByIds } from "../../abstractions";
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetPublishedByIdsParams,
    CmsModel
} from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

export class GetPublishedEntriesByIds implements IGetPublishedEntriesByIds {
    private readonly operation: CmsEntryStorageOperations["getPublishedByIds"];
    private readonly transform: ITransformEntryCallable;

    public constructor(
        operation: CmsEntryStorageOperations["getPublishedByIds"],
        transform: ITransformEntryCallable
    ) {
        this.operation = operation;
        this.transform = transform;
    }

    public async execute(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) {
        const result = await this.operation(model, params);

        return await Promise.all(
            result.map(async entry => {
                return await this.transform(model, entry);
            })
        );
    }
}

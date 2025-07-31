import type { IGetLatestEntriesByIds } from "../../abstractions";
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetLatestByIdsParams,
    CmsModel
} from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

export class GetLatestEntriesByIds implements IGetLatestEntriesByIds {
    private readonly operation: CmsEntryStorageOperations["getLatestByIds"];
    private readonly transform: ITransformEntryCallable;

    public constructor(
        operation: CmsEntryStorageOperations["getLatestByIds"],
        transform: ITransformEntryCallable
    ) {
        this.operation = operation;
        this.transform = transform;
    }

    public async execute(model: CmsModel, params: CmsEntryStorageOperationsGetLatestByIdsParams) {
        const result = await this.operation(model, params);

        return await Promise.all(
            result.map(async entry => {
                return this.transform(model, entry);
            })
        );
    }
}

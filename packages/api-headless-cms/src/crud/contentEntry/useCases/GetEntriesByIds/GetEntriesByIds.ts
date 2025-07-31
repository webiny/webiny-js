import type { IGetEntriesByIds } from "../../abstractions";
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsGetByIdsParams,
    CmsModel
} from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

export class GetEntriesByIds implements IGetEntriesByIds {
    private readonly operation: CmsEntryStorageOperations["getByIds"];
    private readonly transform: ITransformEntryCallable;

    public constructor(
        operation: CmsEntryStorageOperations["getByIds"],
        transform: ITransformEntryCallable
    ) {
        this.operation = operation;
        this.transform = transform;
    }

    public async execute(model: CmsModel, params: CmsEntryStorageOperationsGetByIdsParams) {
        const result = await this.operation(model, params);

        return await Promise.all(
            result.map(entry => {
                return this.transform(model, entry);
            })
        );
    }
}

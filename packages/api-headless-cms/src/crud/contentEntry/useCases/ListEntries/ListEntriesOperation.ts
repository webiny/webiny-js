import type { IListEntriesOperation } from "../../abstractions";
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsListParams,
    CmsModel
} from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

export class ListEntriesOperation implements IListEntriesOperation {
    private readonly operation: CmsEntryStorageOperations["list"];
    private readonly transform: ITransformEntryCallable;

    public constructor(
        operation: CmsEntryStorageOperations["list"],
        transform: ITransformEntryCallable
    ) {
        this.operation = operation;
        this.transform = transform;
    }

    public async execute(model: CmsModel, params: CmsEntryStorageOperationsListParams) {
        const result = await this.operation(model, params);
        return {
            ...result,
            items: await Promise.all(
                result.items.map(async entry => {
                    return this.transform(model, entry);
                })
            )
        };
    }
}

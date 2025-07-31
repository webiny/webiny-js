import type { IRestoreEntryFromBinOperation } from "~/crud/contentEntry/abstractions";
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsRestoreFromBinParams,
    CmsModel
} from "~/types";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

export class RestoreEntryFromBinOperation implements IRestoreEntryFromBinOperation {
    private readonly operation: CmsEntryStorageOperations["restoreFromBin"];
    private readonly transform: ITransformEntryCallable;

    public constructor(
        operation: CmsEntryStorageOperations["restoreFromBin"],
        transform: ITransformEntryCallable
    ) {
        this.operation = operation;
        this.transform = transform;
    }

    public async execute(model: CmsModel, params: CmsEntryStorageOperationsRestoreFromBinParams) {
        const result = await this.operation(model, params);

        return await this.transform(model, result);
    }
}

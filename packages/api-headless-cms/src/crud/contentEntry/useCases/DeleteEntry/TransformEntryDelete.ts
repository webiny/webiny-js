import { entryFromStorageTransform } from "~/utils/entryStorage";
import { CmsContext, CmsEntry, CmsEntryStorageOperationsDeleteParams, CmsModel } from "~/types";

export class TransformEntryDelete {
    private context: CmsContext;

    constructor(context: CmsContext) {
        this.context = context;
    }
    async execute(
        model: CmsModel,
        initialEntry: CmsEntry
    ): Promise<CmsEntryStorageOperationsDeleteParams> {
        const entry = await entryFromStorageTransform(this.context, model, initialEntry);

        return {
            entry
        };
    }
}

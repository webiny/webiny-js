import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { IListEntries } from "./IListEntries";
import { HcmsTasksContext } from "~/types";

export class ListDeletedEntries implements IListEntries {
    async execute(context: HcmsTasksContext, modelId: string, params: CmsEntryListParams) {
        const model = await context.cms.getModel(modelId);

        if (!model) {
            throw new Error(`Model with ${modelId} not found!`);
        }

        const [entries, meta] = await context.cms.listDeletedEntries(model, params);

        return {
            entries,
            meta
        };
    }
}

import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { IListEntries } from "./IListEntries";
import { HcmsTasksContext } from "~/types";

export class ListDeletedEntries implements IListEntries {
    private readonly context: HcmsTasksContext;

    constructor(context: HcmsTasksContext) {
        this.context = context;
    }

    async execute(modelId: string, params: CmsEntryListParams) {
        const model = await this.context.cms.getModel(modelId);

        if (!model) {
            throw new Error(`Model with ${modelId} not found!`);
        }

        const [entries, meta] = await this.context.cms.listDeletedEntries(model, params);

        return {
            entries,
            meta
        };
    }
}

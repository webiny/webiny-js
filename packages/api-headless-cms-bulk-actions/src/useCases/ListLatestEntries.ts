import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { IListEntries } from "~/abstractions";
import { HcmsBulkActionsContext } from "~/types";

class ListLatestEntries implements IListEntries {
    private readonly context: HcmsBulkActionsContext;

    constructor(context: HcmsBulkActionsContext) {
        this.context = context;
    }

    async execute(modelId: string, params: CmsEntryListParams) {
        const model = await this.context.cms.getModel(modelId);

        if (!model) {
            throw new Error(`Model with ${modelId} not found!`);
        }

        const [entries, meta] = await this.context.cms.listLatestEntries(model, params);

        return {
            entries,
            meta
        };
    }
}

export const createListLatestEntries = (context: HcmsBulkActionsContext) => {
    return new ListLatestEntries(context);
};

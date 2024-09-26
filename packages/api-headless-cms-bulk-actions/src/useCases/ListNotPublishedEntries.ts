import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { IListEntries } from "~/abstractions";
import { HcmsBulkActionsContext } from "~/types";

class ListNotPublishedEntries implements IListEntries {
    private readonly context: HcmsBulkActionsContext;

    constructor(context: HcmsBulkActionsContext) {
        this.context = context;
    }

    async execute(modelId: string, params: CmsEntryListParams) {
        const model = await this.context.cms.getModel(modelId);

        if (!model) {
            throw new Error(`Model with ${modelId} not found!`);
        }

        const [entries, meta] = await this.context.cms.listLatestEntries(model, {
            ...params,
            where: {
                ...params.where,
                status_not: "published"
            }
        });

        return {
            entries,
            meta
        };
    }
}

export const createListNotPublishedEntries = (context: HcmsBulkActionsContext) => {
    return new ListNotPublishedEntries(context);
};

import { CmsModel } from "@webiny/api-headless-cms/types";
import { IProcessEntry } from "~/abstractions";
import { HcmsBulkActionsContext } from "~/types";

class UnpublishEntry implements IProcessEntry {
    private readonly context: HcmsBulkActionsContext;

    constructor(context: HcmsBulkActionsContext) {
        this.context = context;
    }

    async execute(model: CmsModel, id: string): Promise<void> {
        await this.context.cms.unpublishEntry(model, id);
    }
}

export const createUnpublishEntry = (context: HcmsBulkActionsContext) => {
    return new UnpublishEntry(context);
};

import { parseIdentifier } from "@webiny/utils";
import { IProcessEntry } from "./IProcessEntry";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { HcmsBulkActionsContext } from "~/types";

export class MoveEntryToTrash implements IProcessEntry {
    private readonly context: HcmsBulkActionsContext;

    constructor(context: HcmsBulkActionsContext) {
        this.context = context;
    }

    async execute(model: CmsModel, id: string): Promise<void> {
        const { id: entryId } = parseIdentifier(id);
        await this.context.cms.deleteEntry(model, entryId, { permanently: false });
    }
}

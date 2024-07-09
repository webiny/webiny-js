import { IProcessEntry } from "./IProcessEntry";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { HcmsBulkActionsContext } from "~/types";

interface MoveEntryToFolderData {
    folderId?: string;
}

export class MoveEntryToFolder implements IProcessEntry {
    private readonly context: HcmsBulkActionsContext;

    constructor(context: HcmsBulkActionsContext) {
        this.context = context;
    }

    async execute(model: CmsModel, id: string, data?: MoveEntryToFolderData): Promise<void> {
        if (!data?.folderId) {
            throw new Error(`Missing "data.folderId" in the input.`);
        }
        await this.context.cms.moveEntry(model, id, data.folderId);
    }
}

import { CmsModel } from "@webiny/api-headless-cms/types";
import { IProcessEntry } from "~/abstractions";
import { HcmsBulkActionsContext } from "~/types";

interface MoveEntryToFolderData {
    folderId?: string;
}

class MoveEntryToFolder implements IProcessEntry {
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

export const createMoveEntryToFolder = (context: HcmsBulkActionsContext) => {
    return new MoveEntryToFolder(context);
};

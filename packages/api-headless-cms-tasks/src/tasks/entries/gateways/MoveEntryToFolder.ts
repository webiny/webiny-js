import { IProcessEntry } from "./IProcessEntry";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { HcmsTasksContext } from "~/types";

interface MoveEntryToFolderData {
    folderId?: string;
}

export class MoveEntryToFolder implements IProcessEntry {
    async execute(
        context: HcmsTasksContext,
        model: CmsModel,
        id: string,
        data?: MoveEntryToFolderData
    ): Promise<void> {
        if (!data?.folderId) {
            throw new Error(`Missing "data.folderId" in the input.`);
        }
        await context.cms.moveEntry(model, id, data.folderId);
    }
}

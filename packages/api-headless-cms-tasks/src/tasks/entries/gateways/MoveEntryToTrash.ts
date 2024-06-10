import { parseIdentifier } from "@webiny/utils";
import { IProcessEntry } from "./IProcessEntry";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { HcmsTasksContext } from "~/types";

export class MoveEntryToTrash implements IProcessEntry {
    async execute(context: HcmsTasksContext, model: CmsModel, id: string): Promise<void> {
        const { id: entryId } = parseIdentifier(id);
        await context.cms.deleteEntry(model, entryId, { permanently: false });
    }
}

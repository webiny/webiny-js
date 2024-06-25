import { parseIdentifier } from "@webiny/utils";
import { IProcessEntry } from "./IProcessEntry";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { HcmsTasksContext } from "~/types";

export class DeleteEntry implements IProcessEntry {
    private readonly context: HcmsTasksContext;

    constructor(context: HcmsTasksContext) {
        this.context = context;
    }

    async execute(model: CmsModel, id: string): Promise<void> {
        const { id: entryId } = parseIdentifier(id);
        await this.context.cms.deleteEntry(model, entryId, {
            permanently: true
        });
    }
}

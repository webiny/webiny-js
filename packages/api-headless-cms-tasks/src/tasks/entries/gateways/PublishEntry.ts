import { IProcessEntry } from "./IProcessEntry";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { HcmsTasksContext } from "~/types";

export class PublishEntry implements IProcessEntry {
    private readonly context: HcmsTasksContext;

    constructor(context: HcmsTasksContext) {
        this.context = context;
    }

    async execute(model: CmsModel, id: string): Promise<void> {
        await this.context.cms.publishEntry(model, id);
    }
}

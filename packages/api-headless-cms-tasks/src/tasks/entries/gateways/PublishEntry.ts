import { IProcessEntry } from "./IProcessEntry";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { HcmsTasksContext } from "~/types";

export class PublishEntry implements IProcessEntry {
    async execute(context: HcmsTasksContext, model: CmsModel, id: string): Promise<void> {
        await context.cms.publishEntry(model, id);
    }
}

import { HcmsTasksContext } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";

export interface IProcessEntry {
    execute: (context: HcmsTasksContext, model: CmsModel, id: string, data?: any) => Promise<void>;
}

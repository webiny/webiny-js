import { CmsModel } from "@webiny/api-headless-cms/types";

export interface IProcessEntry {
    execute: (model: CmsModel, id: string, data?: any) => Promise<void>;
}

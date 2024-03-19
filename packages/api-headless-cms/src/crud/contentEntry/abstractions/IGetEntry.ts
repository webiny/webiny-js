import { CmsEntry, CmsEntryGetParams, CmsModel } from "~/types";

export interface IGetEntry {
    execute: (model: CmsModel, params: CmsEntryGetParams) => Promise<CmsEntry>;
}

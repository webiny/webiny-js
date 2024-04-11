import { CmsEntry, CmsModel } from "~/types";

export interface IRestoreEntryFromBin {
    execute: (model: CmsModel, id: string) => Promise<CmsEntry>;
}

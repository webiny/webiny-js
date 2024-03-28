import { CmsEntry, CmsModel } from "~/types";

export interface IRestoreEntry {
    execute: (model: CmsModel, id: string) => Promise<CmsEntry>;
}

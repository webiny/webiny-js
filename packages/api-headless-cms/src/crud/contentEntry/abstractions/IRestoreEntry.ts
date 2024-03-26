import { CmsModel } from "~/types";

export interface IRestoreEntry {
    execute: (model: CmsModel, id: string) => Promise<void>;
}

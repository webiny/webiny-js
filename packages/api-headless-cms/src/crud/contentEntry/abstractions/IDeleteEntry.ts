import { CmsDeleteEntryOptions, CmsModel } from "~/types";

export interface IDeleteEntry {
    execute: (model: CmsModel, id: string, params: CmsDeleteEntryOptions) => Promise<void>;
}

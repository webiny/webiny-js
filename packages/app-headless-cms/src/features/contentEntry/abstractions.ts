import { createAbstraction } from "@webiny/feature/admin";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { CmsContentEntry } from "~/types.js";
import type { CmsModel } from "~/types.js";

export const ContentEntriesCache =
    createAbstraction<IListCache<CmsContentEntry>>("ContentEntriesCache");

export namespace ContentEntriesCache {
    export type Interface = IListCache<CmsContentEntry>;
}

export interface ICmsModelAccessor {
    getModel(): CmsModel;
    setModel(model: CmsModel): void;
}

export const CmsModelAccessor = createAbstraction<ICmsModelAccessor>("CmsModelAccessor");

export namespace CmsModelAccessor {
    export type Interface = ICmsModelAccessor;
}

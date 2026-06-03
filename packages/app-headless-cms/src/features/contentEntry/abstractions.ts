import { createAbstraction } from "@webiny/feature/admin";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface IContentEntriesCacheProvider {
    get(modelId: string): IListCache<CmsContentEntry>;
}

export const ContentEntriesCacheProvider = createAbstraction<IContentEntriesCacheProvider>(
    "ContentEntriesCacheProvider"
);

export namespace ContentEntriesCacheProvider {
    export type Interface = IContentEntriesCacheProvider;
}

export interface ICmsModelAccessor {
    getModel(): CmsModel;
    setModel(model: CmsModel): void;
}

export const CmsModelAccessor = createAbstraction<ICmsModelAccessor>("CmsModelAccessor");

export namespace CmsModelAccessor {
    export type Interface = ICmsModelAccessor;
}

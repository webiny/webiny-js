import { createAbstraction } from "@webiny/feature/admin";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface IEntryGraphQLFields {
    getSystemFields(model: CmsModel): string;
    getValuesBlock(model: CmsModel): string;
}

export const EntryGraphQLFields = createAbstraction<IEntryGraphQLFields>("EntryGraphQLFields");

export namespace EntryGraphQLFields {
    export type Interface = IEntryGraphQLFields;
}

export interface IContentEntriesCacheProvider {
    get(modelId: string): IListCache<CmsContentEntry>;
}

export const ContentEntriesCacheProvider = createAbstraction<IContentEntriesCacheProvider>(
    "ContentEntriesCacheProvider"
);

export namespace ContentEntriesCacheProvider {
    export type Interface = IContentEntriesCacheProvider;
}

export interface ICmsModelContext {
    getModel(): CmsModel;
    setModel(model: CmsModel): void;
}

export const CmsModelContext = createAbstraction<ICmsModelContext>("CmsModelContext");

export namespace CmsModelContext {
    export type Interface = ICmsModelContext;
}

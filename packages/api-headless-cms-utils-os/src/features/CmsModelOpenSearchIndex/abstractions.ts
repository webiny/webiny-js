import { createAbstraction } from "@webiny/feature/api/index.js";
import type { OpenSearchIndexRequestBody } from "@webiny/api-opensearch/types.js";
import { type StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";
export { type StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface ICmsModelOpenSearchIndexParams {
    model: StorageCmsModel;
}

export interface ICmsModelOpenSearchIndexResult {
    settings: OpenSearchIndexRequestBody;
    shared: boolean;
}

export interface ICmsModelOpenSearchIndex {
    execute(params: ICmsModelOpenSearchIndexParams): Promise<ICmsModelOpenSearchIndexResult>;
}

export const CmsModelOpenSearchIndex = createAbstraction<ICmsModelOpenSearchIndex>(
    "Cms/Model/OpenSearch/Index"
);

export namespace CmsModelOpenSearchIndex {
    export type Interface = ICmsModelOpenSearchIndex;
    export type Params = ICmsModelOpenSearchIndexParams;
    export type Result = ICmsModelOpenSearchIndexResult;
    export type Model = StorageCmsModel;
}

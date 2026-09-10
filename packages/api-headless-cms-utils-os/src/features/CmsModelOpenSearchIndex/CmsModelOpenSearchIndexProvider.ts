import { createAbstraction } from "@webiny/feature/api/index.js";
import type { OpenSearchIndexRequestBody } from "@webiny/api-opensearch/types.js";
import type { CmsModelOpenSearchIndex } from "./abstractions.js";

export interface ICmsModelOpenSearchIndexProviderResult {
    index: string;
    settings: OpenSearchIndexRequestBody;
    shared: boolean;
}

export interface ICmsModelOpenSearchIndexProvider {
    execute(
        params: CmsModelOpenSearchIndex.Params
    ): Promise<ICmsModelOpenSearchIndexProviderResult>;
}

export const CmsModelOpenSearchIndexProvider = createAbstraction<ICmsModelOpenSearchIndexProvider>(
    "Cms/Model/OpenSearch/IndexProvider"
);

export namespace CmsModelOpenSearchIndexProvider {
    export type Interface = ICmsModelOpenSearchIndexProvider;
    export type Result = ICmsModelOpenSearchIndexProviderResult;
}

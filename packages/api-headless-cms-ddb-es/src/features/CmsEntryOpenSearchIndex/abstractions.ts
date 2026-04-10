import { createAbstraction } from "@webiny/feature/api";
import type { OpenSearchIndexRequestBody } from "@webiny/api-opensearch/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface ICmsEntryOpenSearchIndexCanUseParams {
    model: Pick<CmsModel, "tenant" | "modelId" | "group">;
}

export interface ICmsEntryOpenSearchIndex {
    readonly body: OpenSearchIndexRequestBody;
    canUse(params: ICmsEntryOpenSearchIndexCanUseParams): boolean;
}

export const CmsEntryOpenSearchIndex = createAbstraction<ICmsEntryOpenSearchIndex>(
    "Cms/Entry/OpenSearch/Index"
);

export namespace CmsEntryOpenSearchIndex {
    export type Interface = ICmsEntryOpenSearchIndex;
    export type CanUseParams = ICmsEntryOpenSearchIndexCanUseParams;
}

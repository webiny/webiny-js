import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types.js";

export interface ModifyQueryParams {
    query: OpenSearchBoolQueryConfig;
    model: CmsModel;
    where: Record<string, any>;
}

export interface ICmsEntryOpenSearchQueryModifier {
    readonly modelId?: string;
    modifyQuery(params: ModifyQueryParams): void;
}

export const CmsEntryOpenSearchQueryModifier = createAbstraction<ICmsEntryOpenSearchQueryModifier>(
    "Cms/Entry/OpenSearch/QueryModifier"
);

export namespace CmsEntryOpenSearchQueryModifier {
    export type Interface = ICmsEntryOpenSearchQueryModifier;
    export type Params = ModifyQueryParams;
}

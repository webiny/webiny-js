import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type {
    CmsEntryListParams,
    CmsEntryListWhere
} from "@webiny/api-headless-cms/types/index.js";
import type { PrimitiveValue, SearchBody } from "@webiny/api-opensearch/types.js";

export interface ICmsEntryOpenSearchBodyBuilderParams {
    model: CmsModel;
    params: Omit<CmsEntryListParams, "where" | "after"> & {
        where: CmsEntryListWhere;
        after?: PrimitiveValue[];
    };
}

export interface ICmsEntryOpenSearchBodyBuilder {
    build(params: ICmsEntryOpenSearchBodyBuilderParams): SearchBody;
}

export const CmsEntryOpenSearchBodyBuilder = createAbstraction<ICmsEntryOpenSearchBodyBuilder>(
    "Cms/Entry/OpenSearch/BodyBuilder"
);

export namespace CmsEntryOpenSearchBodyBuilder {
    export type Interface = ICmsEntryOpenSearchBodyBuilder;
    export type Params = ICmsEntryOpenSearchBodyBuilderParams;
}

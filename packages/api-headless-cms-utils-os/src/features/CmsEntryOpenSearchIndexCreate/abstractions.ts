import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface ICmsEntryOpenSearchIndexCreateParams {
    model: CmsModel;
}

export interface ICmsEntryOpenSearchIndexCreate {
    execute(params: ICmsEntryOpenSearchIndexCreateParams): Promise<void>;
}

export const CmsEntryOpenSearchIndexCreate = createAbstraction<ICmsEntryOpenSearchIndexCreate>(
    "Cms/Entry/OpenSearch/IndexCreate"
);

export namespace CmsEntryOpenSearchIndexCreate {
    export type Interface = ICmsEntryOpenSearchIndexCreate;
    export type Params = ICmsEntryOpenSearchIndexCreateParams;
}

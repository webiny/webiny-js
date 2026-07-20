import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface ICmsEntryOpenSearchIndexDeleteParams {
    model: CmsModel;
}

export interface ICmsEntryOpenSearchIndexDelete {
    execute(params: ICmsEntryOpenSearchIndexDeleteParams): Promise<void>;
}

export const CmsEntryOpenSearchIndexDelete = createAbstraction<ICmsEntryOpenSearchIndexDelete>(
    "Cms/Entry/OpenSearch/IndexDelete"
);

export namespace CmsEntryOpenSearchIndexDelete {
    export type Interface = ICmsEntryOpenSearchIndexDelete;
    export type Params = ICmsEntryOpenSearchIndexDeleteParams;
}

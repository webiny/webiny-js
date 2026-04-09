import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { SearchBody } from "@webiny/api-opensearch";

export interface ModifyBodyParams {
    body: SearchBody;
    model: CmsModel;
    where: Record<string, any>;
}

export interface ICmsEntryOpenSearchBodyModifier {
    readonly modelId?: string;
    modifyBody(params: ModifyBodyParams): void;
}

export const CmsEntryOpenSearchBodyModifier =
    createAbstraction<ICmsEntryOpenSearchBodyModifier>("Cms/Entry/OpenSearch/BodyModifier");

export namespace CmsEntryOpenSearchBodyModifier {
    export type Interface = ICmsEntryOpenSearchBodyModifier;
    export type Params = ModifyBodyParams;
}

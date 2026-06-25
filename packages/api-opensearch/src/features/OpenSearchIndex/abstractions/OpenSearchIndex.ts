import { createAbstraction } from "@webiny/feature/exports/api.js";
import type { OpenSearchIndexRequestBody } from "~/types.js";

export interface IOpenSearchIndex {
    readonly body: OpenSearchIndexRequestBody;
    canUse(): boolean;
}

export const OpenSearchIndex = createAbstraction<IOpenSearchIndex>("OpenSearch/Index");

export namespace OpenSearchIndex {
    export type Interface = IOpenSearchIndex;
}

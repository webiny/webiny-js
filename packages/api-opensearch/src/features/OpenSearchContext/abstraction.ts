import { createAbstraction } from "@webiny/feature/api";
import type { Client as OpenSearchClient } from "~/types.js";

export interface IOpenSearchContext {
    opensearch: OpenSearchClient;
    /**
     * @deprecated use `opensearch`property instead.
     * @see IOpenSearchContext.opensearch
     */
    elasticsearch: OpenSearchClient;
}

export const OpenSearchContext = createAbstraction<IOpenSearchContext>("OpenSearch/Context");

export namespace OpenSearchContext {
    export type Interface = IOpenSearchContext;
    export type Client = OpenSearchClient;
}

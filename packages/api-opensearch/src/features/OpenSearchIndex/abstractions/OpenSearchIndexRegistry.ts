import { createAbstraction } from "@webiny/feature/exports/api.js";
import type { OpenSearchIndex } from "./OpenSearchIndex.js";

export interface IOpenSearchIndexRegistry {
    getLastAdded(): OpenSearchIndex.Interface;
    getAll(): OpenSearchIndex.Interface[];
}

export const OpenSearchIndexRegistry = createAbstraction<IOpenSearchIndexRegistry>(
    "OpenSearch/IndexRegistry"
);

export namespace OpenSearchIndexRegistry {
    export type Interface = IOpenSearchIndexRegistry;
}

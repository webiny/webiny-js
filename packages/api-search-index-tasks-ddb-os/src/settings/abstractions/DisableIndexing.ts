import { createAbstraction } from "@webiny/feature/api";
import type { IIndexSettings } from "@webiny/api-search-index-tasks/abstractions/IndexManager.js";

export interface IDisableIndexing {
    exec(index: string): Promise<IIndexSettings>;
}

export const DisableIndexing = createAbstraction<IDisableIndexing>(
    "SearchIndexTasksDdbOs/DisableIndexing"
);

export namespace DisableIndexing {
    export type Interface = IDisableIndexing;
    export type Settings = IIndexSettings;
}

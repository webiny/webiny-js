import { createAbstraction } from "@webiny/feature/api";
import type { IIndexSettings } from "@webiny/api-search-index-tasks/abstractions/IndexManager.js";

export interface IEnableIndexing {
    exec(index: string, settings: IIndexSettings): Promise<void>;
}

export const EnableIndexing = createAbstraction<IEnableIndexing>(
    "SearchIndexTasksDdbOs/EnableIndexing"
);

export namespace EnableIndexing {
    export type Interface = IEnableIndexing;
    export type Settings = IIndexSettings;
}

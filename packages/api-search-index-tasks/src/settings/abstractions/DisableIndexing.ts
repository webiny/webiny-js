import { createAbstraction } from "@webiny/feature/api";
import type { IIndexSettings } from "~/abstractions/IndexManager.js";

export interface IDisableIndexing {
    exec(index: string): Promise<IIndexSettings>;
}

export const DisableIndexing = createAbstraction<IDisableIndexing>(
    "SearchIndexTasks/DisableIndexing"
);

export namespace DisableIndexing {
    export type Interface = IDisableIndexing;
    export type Settings = IIndexSettings;
}

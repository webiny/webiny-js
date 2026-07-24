import { createAbstraction } from "@webiny/feature/api";
import type { IIndexSettings } from "~/abstractions/IndexManager.js";

export interface IEnableIndexing {
    exec(index: string, settings: IIndexSettings): Promise<void>;
}

export const EnableIndexing = createAbstraction<IEnableIndexing>("SearchIndexTasks/EnableIndexing");

export namespace EnableIndexing {
    export type Interface = IEnableIndexing;
    export type Settings = IIndexSettings;
}

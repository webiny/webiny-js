import { createAbstraction } from "@webiny/feature/api";
import type { IIndexSettings } from "@webiny/api-search-index-tasks/abstractions/IndexManager.js";

export interface IIndexSettingsManager {
    getSettings(index: string): Promise<IIndexSettings>;
    setSettings(index: string, settings: IIndexSettings): Promise<void>;
}

export const IndexSettingsManager = createAbstraction<IIndexSettingsManager>(
    "SearchIndexTasksDdbOs/IndexSettingsManager"
);

export namespace IndexSettingsManager {
    export type Interface = IIndexSettingsManager;
    export type Settings = IIndexSettings;
}

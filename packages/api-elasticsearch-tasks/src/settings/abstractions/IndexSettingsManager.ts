import { createAbstraction } from "@webiny/feature/api";
import type { IIndexSettingsValues } from "~/types.js";

export interface IIndexSettingsManager {
    getSettings(index: string): Promise<IIndexSettingsValues>;
    setSettings(index: string, settings: IIndexSettingsValues): Promise<void>;
}

export const IndexSettingsManager = createAbstraction<IIndexSettingsManager>(
    "ElasticsearchTasks/IndexSettingsManager"
);

export namespace IndexSettingsManager {
    export type Interface = IIndexSettingsManager;
    export type Settings = IIndexSettingsValues;
}

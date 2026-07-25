import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IIndexSettings {
    numberOfReplicas: number;
    refreshInterval: string;
}

export interface IIndexSettingsMap {
    [index: string]: IIndexSettings;
}

export interface IIndexManager {
    list(): Promise<string[]>;
    indexExists(index: string): Promise<boolean>;
    createIndex(index: string, settings?: GenericRecord): Promise<void>;
    disableIndexing(index: string): Promise<IIndexSettings>;
    enableIndexing(index?: string): Promise<void>;
    settings: IIndexSettingsMap;
}

export const IndexManager = createAbstraction<IIndexManager>("SearchIndexTasks/IndexManager");

export namespace IndexManager {
    export type Interface = IIndexManager;
    export type Settings = IIndexSettings;
    export type SettingsMap = IIndexSettingsMap;
}

import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager, IIndexSettings, IIndexSettingsMap } from "./IndexManager.js";

export interface IIndexManagerFactoryParams {
    settings: IIndexSettingsMap;
    defaults?: Partial<IIndexSettings>;
}

export interface IIndexManagerFactory {
    createIndexManager(params: IIndexManagerFactoryParams): IIndexManager;
}

export const IndexManagerFactory = createAbstraction<IIndexManagerFactory>(
    "SearchIndexTasks/IndexManagerFactory"
);

export namespace IndexManagerFactory {
    export type Interface = IIndexManagerFactory;
    export type Params = IIndexManagerFactoryParams;
}

import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager } from "~/settings/types.js";
import type { IElasticsearchIndexingTaskValuesSettings, IIndexSettingsValues } from "~/types.js";

export interface IIndexManagerFactory {
    createIndexManager(params: IIndexManagerFactoryParams): IIndexManager;
}

export interface IIndexManagerFactoryParams {
    settings: IElasticsearchIndexingTaskValuesSettings;
    defaults?: Partial<IIndexSettingsValues>;
}

export const IndexManagerFactory = createAbstraction<IIndexManagerFactory>(
    "ElasticsearchTasks/IndexManagerFactory"
);

export namespace IndexManagerFactory {
    export type Interface = IIndexManagerFactory;
    export type Params = IIndexManagerFactoryParams;
}

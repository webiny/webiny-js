import type { Knex } from "knex";
import type { PluginsContainer } from "@webiny/plugins/types.js";
import type {
    CmsContext,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types/index.js";

export type { CmsContext };

export interface SqlStorageOperationsFactoryParams {
    knex: Knex;
    plugins: PluginsContainer;
    container: CmsContext["container"];
}

export interface SqlStorageOperationsFactory {
    (params: SqlStorageOperationsFactoryParams): BaseHeadlessCmsStorageOperations;
}

import type {
    CmsContext,
    HeadlessCmsStorageOperations as BaseHeadlessCmsStorageOperations
} from "@webiny/api-headless-cms/types/index.js";

export type { CmsContext };

export interface SqlStorageOperationsFactoryParams {
    container: CmsContext["container"];
}

export interface SqlStorageOperationsFactory {
    (params: SqlStorageOperationsFactoryParams): BaseHeadlessCmsStorageOperations;
}

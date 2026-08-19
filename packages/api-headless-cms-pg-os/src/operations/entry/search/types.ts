import type {
    CmsEntryValues,
    CmsModel,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { Client as OpenSearchClient } from "@webiny/api-opensearch";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { CmsModelOpenSearchIndexProvider } from "@webiny/api-headless-cms-utils-os/features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.js";

export type GetStorageOperationsModel = <T extends CmsEntryValues = CmsEntryValues>(
    model: CmsModel
) => StorageOperationsCmsModel<T>;

export interface OpenSearchBodyBuilderBuildParams {
    model: CmsModel;
    params: Record<string, any>;
}

export interface OpenSearchBodyBuilder {
    build(params: OpenSearchBodyBuilderBuildParams): Record<string, any>;
}

export interface SearchOperationDeps {
    elasticsearch: OpenSearchClient;
    bodyBuilder: OpenSearchBodyBuilder;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    getStorageOperationsModel: GetStorageOperationsModel;
    indexProvider: CmsModelOpenSearchIndexProvider.Interface;
}

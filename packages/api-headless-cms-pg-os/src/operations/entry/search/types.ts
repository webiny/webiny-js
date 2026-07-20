import type { CmsEntryValues, CmsModel, StorageOperationsCmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { Client as OpenSearchClient } from "@webiny/api-opensearch";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { GetStorageOperationsModel } from "../write/types.js";

export interface SearchOperationDeps {
    elasticsearch: OpenSearchClient;
    bodyBuilder: {
        build(params: {
            model: StorageOperationsCmsModel;
            params: Record<string, any>;
        }): Record<string, any>;
    };
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    getStorageOperationsModel: GetStorageOperationsModel;
}

import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import dbPlugins from "@webiny/handler-db";
import { PluginCollection } from "@webiny/plugins/types";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { CmsParametersPlugin, createCmsExtension } from "@webiny/api-headless-cms";
import { CmsContext } from "~/types";
import { createSecurity } from "~tests/graphql/security";
import { createTable, DynamoDbDriver } from "@webiny/db-dynamodb";
import { createIndexConfigurationPlugin } from "~tests/graphql/createIndexConfigurationPlugin";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { getElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/index.js";
import { createEntryEntity } from "~/definitions/entry";
import { LambdaContext } from "@webiny/handler-aws/types";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { OpenSearchContext } from "@webiny/api-opensearch";

interface UseHandlerParams {
    plugins?: PluginCollection;
    path?: "/graphql" | `/cms/manage/${Lowercase<string>}-${Uppercase<string>}`;
}

export const useHandler = (params: UseHandlerParams = {}) => {
    const { plugins = [] } = params;

    const documentClient = getDocumentClient();
    const { elasticsearchClient } = getElasticsearchClient({ name: "api-headless-cms-ddb-es" });

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = createTestWcpLicense();

    const table = createTable({
        name: process.env.DB_TABLE as string,
        documentClient
    });
    const entryEntity = createEntryEntity({
        table,
        entityName: "CmsEntries"
    });

    const handler = createRawHandler<any, CmsContext & OpenSearchContext>({
        plugins: [
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations,
                testProjectLicense
            }),
            ...cmsStorage.plugins,
            createIndexConfigurationPlugin(),
            new CmsParametersPlugin(async () => {
                return {
                    type: "manage"
                };
            }),
            dbPlugins({
                table: process.env.DB_TABLE,
                driver: new DynamoDbDriver({
                    documentClient
                })
            }),
            createSecurity(),
            createCmsExtension(),
            createRawEventHandler(async ({ context }) => {
                return context;
            }),
            ...plugins
        ]
    });

    const payload = {
        /**
         * If no path defined, use /graphql as we want to make request to main api
         */
        path: params.path || "/cms/manage/en-US",
        headers: {
            ["x-tenant"]: "root",
            ["Content-Type"]: "application/json"
        }
    };

    return {
        createContext: async () => {
            return handler(payload, {} as LambdaContext);
        },
        elasticsearch: elasticsearchClient,
        documentClient,
        table,
        entryEntity
    };
};

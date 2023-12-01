import dbPlugins from "@webiny/handler-db";
import { PluginCollection } from "@webiny/plugins/types";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { CmsParametersPlugin, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { CmsContext } from "~/types";
import { createDummyLocales } from "~tests/graphql/dummyLocales";
import { createSecurity } from "~tests/graphql/security";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { createIndexConfigurationPlugin } from "~tests/graphql/createIndexConfigurationPlugin";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { getElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/getElasticsearchClient";
import { createTable } from "~/definitions/table";
import { createEntryEntity } from "~/definitions/entry";
import { LambdaContext } from "@webiny/handler-aws/types";

interface UseHandlerParams {
    plugins?: PluginCollection;
    path?: "/graphql" | `/cms/manage/${Lowercase<string>}-${Uppercase<string>}`;
}

export const useHandler = (params: UseHandlerParams = {}) => {
    const { plugins = [] } = params;

    const documentClient = getDocumentClient();
    const { elasticsearchClient } = getElasticsearchClient({ name: "api-headless-cms-ddb-es" });
    const i18nStorage = getStorageOps<any[]>("i18n");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const table = createTable({
        documentClient
    });
    const entryEntity = createEntryEntity({
        table,
        entityName: "CmsEntries",
        attributes: {}
    });

    const handler = createRawHandler<any, CmsContext>({
        plugins: [
            createIndexConfigurationPlugin(),
            new CmsParametersPlugin(async () => {
                return {
                    locale: "en-US",
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
            i18nContext(),
            ...i18nStorage.storageOperations,
            createDummyLocales(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({ storageOperations: cmsStorage.storageOperations }),
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

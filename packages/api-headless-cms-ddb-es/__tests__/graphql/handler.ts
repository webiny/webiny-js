import dbPlugins from "@webiny/handler-db";
import { PluginCollection } from "@webiny/plugins/types";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { createRawHandler, createRawEventHandler } from "@webiny/handler-aws";
import { CmsParametersPlugin, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createElasticsearchClient } from "@webiny/api-elasticsearch";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createStorageOperations } from "~/index";
import { CmsContext } from "~/types";

import { createDummyLocales } from "~tests/graphql/dummyLocales";
import { createSecurity } from "~tests/graphql/security";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { createIndexConfigurationPlugin } from "~tests/graphql/createIndexConfigurationPlugin";

interface UseHandlerParams {
    plugins?: PluginCollection;
}

export const useHandler = (params: UseHandlerParams = {}) => {
    const { plugins = [] } = params;

    const elasticsearch = createElasticsearchClient({
        endpoint: "http://localhost:9200"
    });
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
        sslEnabled: false,
        region: "local",
        accessKeyId: "test",
        secretAccessKey: "test"
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
            createSecurity({
                documentClient
            }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            createDummyLocales(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: createStorageOperations({
                    elasticsearch,
                    documentClient
                })
            }),
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
        path: "/cms/manage/en-US",
        headers: {
            ["x-tenant"]: "root",
            ["Content-Type"]: "application/json"
        }
    };

    return {
        createContext: async () => {
            return handler(payload, {} as any);
        },
        elasticsearch,
        documentClient
    };
};

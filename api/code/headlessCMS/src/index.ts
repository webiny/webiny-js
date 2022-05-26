import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import securityPlugins from "./security";
import {
    createContentHeadlessCmsContext,
    createContentHeadlessCmsGraphQL
} from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb";
import headlessCmsModelFieldToGraphQLPlugins from "@webiny/api-headless-cms/content/plugins/graphqlFields";
import logsPlugins from "@webiny/handler-logs";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./plugins/scaffolds";

const debug = process.env.DEBUG === "true";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler({
    plugins: [
        createWcpContext(),
        createWcpGraphQL(),
        dynamoDbPlugins(),
        logsPlugins(),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({ documentClient })
        }),
        securityPlugins({ documentClient }),
        i18nPlugins(),
        i18nDynamoDbStorageOperations(),
        i18nContentPlugins(),
        createContentHeadlessCmsContext({
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient,
                modelFieldToGraphQLPlugins: headlessCmsModelFieldToGraphQLPlugins()
            })
        }),
        createContentHeadlessCmsGraphQL({ debug }),
        scaffoldsPlugins()
    ],
    http: { debug }
});

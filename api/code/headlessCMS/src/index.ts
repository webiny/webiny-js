import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import elasticSearch from "@webiny/api-elasticsearch";
import headlessCmsPlugins from "@webiny/api-headless-cms/content";
import headlessCmsDynamoDbElasticStorageOperation from "@webiny/api-headless-cms-ddb-es";
import securityPlugins from "./security";
import logsPlugins from "@webiny/handler-logs";
import securityAdminUsersDynamoDbStorageOperations from "@webiny/api-security-admin-users-so-ddb";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./plugins/scaffolds";

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: [
        dynamoDbPlugins(),
        logsPlugins(),
        elasticSearch({ endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}` }),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({
                documentClient: new DocumentClient({
                    convertEmptyValues: true,
                    region: process.env.AWS_REGION
                })
            })
        }),
        securityPlugins(),
        i18nPlugins(),
        i18nDynamoDbStorageOperations(),
        i18nContentPlugins(),
        headlessCmsPlugins({ debug }),
        headlessCmsDynamoDbElasticStorageOperation(),
        scaffoldsPlugins(),
        securityAdminUsersDynamoDbStorageOperations()
    ],
    http: { debug }
});

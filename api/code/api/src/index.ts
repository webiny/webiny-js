import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import securityPlugins from "@webiny/api-security/authenticator";
import cognitoAuthentication from "@webiny/api-plugin-security-cognito/authentication";
import cognitoIdentityProvider from "@webiny/api-plugin-security-cognito/identityProvider";
import i18nPlugins from "@webiny/api-i18n/plugins";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import pageBuilderPlugins from "@webiny/api-page-builder/plugins";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import elasticSearch from "@webiny/api-plugin-elastic-search-client";
import filesPlugins from "@webiny/api-file-manager/plugins";

export const handler = createHandler(
    graphqlPlugins({
        debug: process.env.DEBUG,
        server: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        }
    }),
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
    // Adds a context plugin to process `security` plugins for authentication
    securityPlugins(),

    // Add Cognito plugin for authentication
    cognitoAuthentication({
        region: process.env.COGNITO_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        identityType: "admin"
    }),

    // Add Cognito IDP plugin
    cognitoIdentityProvider({
        region: process.env.COGNITO_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID
    }),
    i18nPlugins(),
    i18nContentPlugins(),
    filesPlugins(),
    pageBuilderPlugins()
);

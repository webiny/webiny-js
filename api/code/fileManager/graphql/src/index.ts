import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import settingsManagerPlugins from "@webiny/api-settings-manager/client";
import filesPlugins from "@webiny/api-file-manager/plugins";
import filesResolvers from "@webiny/api-plugin-files-resolvers-mongodb";
import securityPlugins from "@webiny/api-security/authenticator";
import permissionsManager from "@webiny/api-security-permissions-manager/client";
import cognitoAuthentication from "@webiny/api-plugin-security-cognito/authentication";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb/index";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import elasticSearch from "@webiny/api-plugin-elastic-search-client";

export const handler = createHandler(
    apolloServerPlugins({
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
    settingsManagerPlugins({ functionName: process.env.SETTINGS_MANAGER_FUNCTION }),
    // Adds a context plugin to process `security` plugins for authentication
    securityPlugins(),
    // Adds a Permissions Manager plugins for authorization
    permissionsManager({ functionName: process.env.PERMISSIONS_MANAGER_FUNCTION }),
    // Add Cognito plugins for authentication
    cognitoAuthentication({
        region: process.env.COGNITO_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        identityType: "admin"
    }),
    filesPlugins(),
    filesResolvers()
);

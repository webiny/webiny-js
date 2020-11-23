import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import securityAuthenticator from "@webiny/api-security/authenticator";
import securityTenancy from "@webiny/api-security-tenancy";
import securityPATAuthentication from "@webiny/api-security-tenancy/authentication";
import securityTenancyAuthorization from "@webiny/api-security-tenancy/authorization";
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
    // Security Tenancy API (users, groups, tenant links).
    securityTenancy(),
    // Adds a context plugin to process `security-authentication` plugins.
    // NOTE: this has to be registered *after* the "securityTenancy" plugins  
    // as some of the authentication plugins rely on tenancy context.
    securityAuthenticator(),
    // Authentication plugin for Personal Access Tokens
    securityPATAuthentication({
        identityType: "admin"
    }),
    // Cognito authentication plugin.
    cognitoAuthentication({
        region: process.env.COGNITO_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        identityType: "admin"
    }),
    // Authorization plugin to load user permissions for requested tenant.
    securityTenancyAuthorization({
        identityType: "admin"
    }),
    // Cognito IDP plugin (CRUD methods for users)
    cognitoIdentityProvider({
        region: process.env.COGNITO_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID
    }),
    i18nPlugins(),
    i18nContentPlugins(),
    filesPlugins(),
    pageBuilderPlugins()
);

import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import createGraphQLHandlerPlugins from "@webiny/handler-graphql";
import { createTenancyAndSecurity } from "./context/tenancySecurity";
import { createPermissions, PermissionsArg } from "./context/helpers";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { CmsParametersPlugin, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb";
import { createMailer } from "~/index";
import { contextSecurity } from "./graphQLHandler";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { SecurityIdentity } from "@webiny/api-security/types";
import { Plugin, PluginCollection } from "@webiny/plugins/types";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export interface CreateHandlerParams {
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}

export const createHandlerPlugins = (params?: CreateHandlerParams) => {
    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const { permissions, identity, plugins = [] } = params || {};

    return [
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        createGraphQLHandlerPlugins(),
        ...createTenancyAndSecurity({
            permissions: [...createPermissions(permissions)],
            identity
        }),
        contextSecurity({ tenant, identity }),
        apiKeyAuthentication({ identityType: "api-key" }),
        apiKeyAuthorization({ identityType: "api-key" }),
        i18nContext(),
        i18nDynamoDbStorageOperations(),
        /**
         * for the page builder we must define the current locale and type
         * we can do that via the CmsParametersPlugin
         */
        new CmsParametersPlugin(async context => {
            const locale = context.i18n.getContentLocale()?.code || "en-US";
            return {
                type: "read",
                locale
            };
        }),
        mockLocalesPlugins(),
        /**
         * We're using ddb-only storageOperations here because current jest setup doesn't allow
         * usage of more than one storageOperations at a time with the help of --keyword flag.
         */
        createHeadlessCmsContext({
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient
            })
        }),
        ...createMailer(),
        plugins
    ];
};

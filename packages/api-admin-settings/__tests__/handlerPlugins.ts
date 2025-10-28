import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./context/tenancySecurity";
import type { PermissionsArg } from "./context/helpers";
import { createPermissions } from "./context/helpers";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";
import apiKeyAuthentication from "@webiny/api-core/legacy/security/plugins/apiKeyAuthentication.js";
import apiKeyAuthorization from "@webiny/api-core/legacy/security/plugins/apiKeyAuthorization.js";

export interface CreateHandlerParams {
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}

export const createHandlerPlugins = (params?: CreateHandlerParams) => {
    const { permissions, identity, plugins = [] } = params || {};

    const documentClient = getDocumentClient();

    return [
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        ...createTenancyAndSecurity({
            permissions: [...createPermissions(permissions)],
            identity
        }),
        apiKeyAuthentication({ identityType: "api-key" }),
        apiKeyAuthorization({ identityType: "api-key" }),
        plugins
    ];
};

import { customAuthenticator } from "./mocks/customAuthenticator";

const { DocumentClient } = require("aws-sdk/clients/dynamodb");
import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import tenancyPlugins from "@webiny/api-tenancy";
import securityPlugins from "@webiny/api-security";
import { PluginCollection } from "@webiny/plugins/types";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import adminUsersPlugins from "../src/index";
// Graphql
import {
    UPDATE_CURRENT_USER,
    DELETE_USER,
    UPDATE_USER,
    CREATE_USER,
    LIST_USERS,
    GET_USER,
    GET_CURRENT_USER,
    LOGIN
} from "./graphql/users";

import { INSTALL, IS_INSTALLED, INSTALL_SECURITY, INSTALL_TENANCY } from "./graphql/install";
import {customAuthorizer} from "./mocks/customAuthorizer";

type UseGqlHandlerParams = {
    fullAccess?: boolean;
    plugins?: PluginCollection;
};

// IMPORTANT: This must be removed from here in favor of a dynamic SO setup.
const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export default (opts: UseGqlHandlerParams = {}) => {
    const defaults = { mockUser: true, fullAccess: false, plugins: [] };
    opts = Object.assign({}, defaults, opts);

    // @ts-ignore
    const { storageOperations } = __getStorageOperations();

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        tenancyPlugins({
            storageOperations: tenancyStorageOperations({ documentClient, table: "DynamoDB" })
        }),
        securityPlugins({
            storageOperations: securityStorageOperations({ documentClient, table: "DynamoDB" })
        }),
        adminUsersPlugins({
            storageOperations
        }),
        graphqlHandler(),
        customAuthenticator(),
        customAuthorizer({ fullAccess: opts.fullAccess }),
        ...opts.plugins
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const securityUser = {
        async login() {
            return invoke({ body: { query: LOGIN } });
        },
        async create(variables) {
            return invoke({ body: { query: CREATE_USER, variables } });
        },
        async update(variables) {
            return invoke({ body: { query: UPDATE_USER, variables } });
        },
        async delete(variables) {
            return invoke({ body: { query: DELETE_USER, variables } });
        },
        async list(variables = {}, headers = {}) {
            return invoke({ body: { query: LIST_USERS, variables }, headers });
        },
        async get(variables) {
            return invoke({ body: { query: GET_USER, variables } });
        },
        async getCurrentUser() {
            return invoke({ body: { query: GET_CURRENT_USER } });
        },
        async updateCurrentUser(variables) {
            return invoke({ body: { query: UPDATE_CURRENT_USER, variables } });
        }
    };

    const install = {
        async isInstalled() {
            return invoke({ body: { query: IS_INSTALLED } });
        },
        async install(variables) {
            await this.installTenancy();
            await this.installSecurity();
            return invoke({ body: { query: INSTALL, variables } });
        },
        async installTenancy() {
            return await invoke({ body: { query: INSTALL_TENANCY } });
        },
        async installSecurity() {
            return await invoke({ body: { query: INSTALL_SECURITY } });
        }
    };

    return {
        handler,
        invoke,
        securityUser,
        install
    };
};

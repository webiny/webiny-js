const { DocumentClient } = require("aws-sdk/clients/dynamodb");
import { createHandler } from "@webiny/handler-aws";
import graphqlHandlerPlugins from "@webiny/handler-graphql";
import { PluginCollection } from "@webiny/plugins/types";
import tenancyPlugins from "@webiny/api-tenancy";
import tenancySoPlugins from "@webiny/api-tenancy-so-ddb";
import securityPlugins from "../src/index";
// Graphql
import {
    UPDATE_SECURITY_GROUP,
    CREATE_SECURITY_GROUP,
    DELETE_SECURITY_GROUP,
    GET_SECURITY_GROUP,
    LIST_SECURITY_GROUPS
} from "./graphql/groups";

import {
    CREATE_API_KEY,
    DELETE_API_KEY,
    GET_API_KEY,
    LIST_API_KEYS,
    UPDATE_API_KEY
} from "./graphql/apiKeys";

import { INSTALL, INSTALL_TENANCY, IS_INSTALLED } from "./graphql/install";
import { LOGIN } from "./graphql/login";
import { CustomGroupAuthorizationPlugin } from "./mocks/CustomGroupAuthorizationPlugin";
import { CustomAuthenticationPlugin } from "./mocks/CustomAuthenticationPlugin";

type UseGqlHandlerParams = {
    fullAccess?: boolean;
    plugins?: PluginCollection;
};

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export default (opts: UseGqlHandlerParams = {}) => {
    const defaults = { fullAccess: false, plugins: [] };
    opts = Object.assign({}, defaults, opts);

    // @ts-ignore
    if (typeof __getStorageOperationsPlugins !== "function") {
        throw new Error(`There is no global "__getStorageOperationsPlugins" function.`);
    }
    // @ts-ignore
    const storageOperations = __getStorageOperationsPlugins();
    if (typeof storageOperations !== "function") {
        throw new Error(
            `A product of "__getStorageOperationsPlugins" must be a function to initialize storage operations.`
        );
    }

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        graphqlHandlerPlugins(),
        tenancyPlugins(),
        tenancySoPlugins({
            documentClient,
            table: "Tenancy"
        }),
        securityPlugins(),
        storageOperations(),
        new CustomAuthenticationPlugin(),
        new CustomGroupAuthorizationPlugin({ fullAccess: opts.fullAccess, identityType: "admin" }),
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

    const securityGroup = {
        async create(variables) {
            return invoke({ body: { query: CREATE_SECURITY_GROUP, variables } });
        },
        async update(variables) {
            return invoke({ body: { query: UPDATE_SECURITY_GROUP, variables } });
        },
        async delete(variables) {
            return invoke({ body: { query: DELETE_SECURITY_GROUP, variables } });
        },
        async list(variables = {}, headers = {}) {
            return invoke({ body: { query: LIST_SECURITY_GROUPS, variables }, headers });
        },
        async get(variables) {
            return invoke({ body: { query: GET_SECURITY_GROUP, variables } });
        }
    };

    const securityApiKeys = {
        async list(variables = {}) {
            return invoke({ body: { query: LIST_API_KEYS, variables } });
        },
        async get(variables) {
            return invoke({ body: { query: GET_API_KEY, variables } });
        },
        async create(variables) {
            return invoke({ body: { query: CREATE_API_KEY, variables } });
        },
        async update(variables) {
            return invoke({ body: { query: UPDATE_API_KEY, variables } });
        },
        async delete(variables) {
            return invoke({ body: { query: DELETE_API_KEY, variables } });
        }
    };

    const install = {
        async isInstalled() {
            return invoke({ body: { query: IS_INSTALLED } });
        },
        async install() {
            await invoke({ body: { query: INSTALL_TENANCY } });
            return invoke({ body: { query: INSTALL } });
        }
    };

    const securityIdentity = {
        async login() {
            return invoke({ body: { query: LOGIN } });
        }
    };

    return {
        handler,
        invoke,
        securityIdentity,
        securityGroup,
        securityApiKeys,
        install
    };
};

import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createHandler } from "@webiny/handler-aws/gateway";
import graphqlHandler from "@webiny/handler-graphql";
import { PluginCollection } from "@webiny/plugins/types";
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
    LOGIN,
    GET_SECURITY_GROUP
} from "./graphql/users";

import { INSTALL, IS_INSTALLED, INSTALL_SECURITY, INSTALL_TENANCY } from "./graphql/install";
import { authenticateUsingHttpHeader } from "@webiny/api-security/plugins/authenticateUsingHttpHeader";
import { createTenancyAndSecurity } from "./tenancySecurity";

interface UseGqlHandlerParams {
    fullAccess?: boolean;
    plugins?: PluginCollection;
}

interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export default (opts: UseGqlHandlerParams = {}) => {
    const defaults = { fullAccess: false, plugins: [] };
    opts = Object.assign({}, defaults, opts);

    // @ts-ignore
    const { storageOperations } = __getStorageOperations();

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: [
            createWcpContext(),
            createWcpGraphQL(),
            ...createTenancyAndSecurity({ fullAccess: defaults.fullAccess }),
            adminUsersPlugins({
                storageOperations
            }),
            graphqlHandler(),
            authenticateUsingHttpHeader(),
            ...(opts.plugins || [])
        ]
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        if (!("authorization" in headers)) {
            headers["authorization"] = "mock-user";
        }
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["content-type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as any,
            {} as any
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const adminUsers = {
        async login(headers = {}) {
            return invoke({ body: { query: LOGIN }, headers });
        },
        async create(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_USER, variables } });
        },
        async update(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_USER, variables } });
        },
        async delete(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_USER, variables } });
        },
        async list(variables: Record<string, any> = {}, headers: Record<string, string> = {}) {
            return invoke({ body: { query: LIST_USERS, variables }, headers });
        },
        async get(variables: Record<string, any>) {
            return invoke({ body: { query: GET_USER, variables } });
        },
        async getCurrentUser() {
            return invoke({ body: { query: GET_CURRENT_USER } });
        },
        async updateCurrentUser(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_CURRENT_USER, variables } });
        }
    };

    const install = {
        async isInstalled() {
            return invoke({ body: { query: IS_INSTALLED } });
        },
        async install(variables: Record<string, any>) {
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

    const securityGroups = {
        async get(variables: Record<string, any>) {
            return invoke({ body: { query: GET_SECURITY_GROUP, variables } });
        }
    };

    return {
        handler,
        invoke,
        adminUsers,
        securityGroups,
        install
    };
};

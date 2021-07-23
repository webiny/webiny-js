import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-graphql";
import tenancyPlugins from "@webiny/api-tenancy";
import securityPlugins from "@webiny/api-security";
import { SecurityIdentity } from "@webiny/api-security";
import { PluginCollection } from "@webiny/plugins/types";
import adminUsersPlugins from "../src/index";
// Graphql
import {
    UPDATE_SECURITY_GROUP,
    CREATE_SECURITY_GROUP,
    DELETE_SECURITY_GROUP,
    GET_SECURITY_GROUP,
    LIST_SECURITY_GROUPS
} from "./graphql/groups";
import {
    UPDATE_CURRENT_SECURITY_USER,
    DELETE_SECURITY_USER,
    UPDATE_SECURITY_USER,
    CREATE_SECURITY_USER,
    LIST_SECURITY_USERS,
    GET_SECURITY_USER,
    GET_CURRENT_SECURITY_USER,
    LOGIN
} from "./graphql/users";

import {
    CREATE_SECURITY_USER_PAT,
    DELETE_CURRENT_SECURITY_USER_PAT,
    GET_CURRENT_SECURITY_USER_WITH_PAT,
    UPDATE_CURRENT_SECURITY_USER_PAT
} from "./graphql/pat";

import {
    CREATE_API_KEY,
    DELETE_API_KEY,
    GET_API_KEY,
    LIST_API_KEYS,
    UPDATE_API_KEY
} from "./graphql/apiKeys";

import { INSTALL, IS_INSTALLED } from "./graphql/install";

type UseGqlHandlerParams = {
    mockUser?: boolean;
    fullAccess?: boolean;
    plugins?: PluginCollection;
};

export default (opts: UseGqlHandlerParams = {}) => {
    const defaults = { mockUser: true, fullAccess: false, plugins: [] };
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
        storageOperations(),
        tenancyPlugins(),
        securityPlugins(),
        adminUsersPlugins(),
        apolloServerPlugins(),
        {
            type: "security-authentication",
            async authenticate(context) {
                if ("Authorization" in context.http.request.headers) {
                    return;
                }

                return new SecurityIdentity({
                    id: "admin@webiny.com",
                    type: "admin",
                    displayName: "John Doe",
                    firstName: "John",
                    lastName: "Doe"
                });
            }
        },
        {
            type: "security-authorization",
            getPermissions: async context => {
                if (opts.fullAccess) {
                    return [{ name: "*" }];
                }

                const tenant = context.tenancy.getCurrentTenant();
                const identity = context.security.getIdentity();
                if (!identity) {
                    return null;
                }
                const permissions = await context.security.users.getUserAccess(identity.id);
                if (!permissions) {
                    return null;
                }
                const tenantAccess = permissions.find(p => p.tenant.id === tenant.id);
                return tenantAccess ? tenantAccess.group.permissions : null;
            }
        },
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
        async list(variables = {}) {
            return invoke({ body: { query: LIST_SECURITY_GROUPS, variables } });
        },
        async get(variables) {
            return invoke({ body: { query: GET_SECURITY_GROUP, variables } });
        }
    };

    const securityUser = {
        async login() {
            return invoke({ body: { query: LOGIN } });
        },
        async create(variables) {
            return invoke({ body: { query: CREATE_SECURITY_USER, variables } });
        },
        async update(variables) {
            return invoke({ body: { query: UPDATE_SECURITY_USER, variables } });
        },
        async delete(variables) {
            return invoke({ body: { query: DELETE_SECURITY_USER, variables } });
        },
        async list(variables, headers = {}) {
            return invoke({ body: { query: LIST_SECURITY_USERS, variables }, headers });
        },
        async get(variables) {
            return invoke({ body: { query: GET_SECURITY_USER, variables } });
        },
        async getCurrentUser() {
            return invoke({ body: { query: GET_CURRENT_SECURITY_USER } });
        },
        async updateCurrentUser(variables) {
            return invoke({ body: { query: UPDATE_CURRENT_SECURITY_USER, variables } });
        }
    };

    const securityUserPAT = {
        async getCurrentUser(variables, headers = {}) {
            return invoke({
                body: { query: GET_CURRENT_SECURITY_USER_WITH_PAT, variables },
                headers
            });
        },
        async createPAT(variables) {
            return invoke({ body: { query: CREATE_SECURITY_USER_PAT, variables } });
        },
        async updatePAT(variables) {
            return invoke({ body: { query: UPDATE_CURRENT_SECURITY_USER_PAT, variables } });
        },
        async deletePAT(variables) {
            return invoke({ body: { query: DELETE_CURRENT_SECURITY_USER_PAT, variables } });
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
        async install(variables) {
            return invoke({ body: { query: INSTALL, variables } });
        }
    };

    return {
        handler,
        invoke,
        securityGroup,
        securityUser,
        securityUserPAT,
        securityApiKeys,
        install
    };
};

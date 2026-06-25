import { createHandler } from "@webiny/handler-aws";
import graphqlHandlerPlugins from "@webiny/handler-graphql";
import type { PluginCollection } from "@webiny/plugins/types";

// Graphql
import {
    CREATE_SECURITY_ROLE,
    DELETE_SECURITY_ROLE,
    GET_SECURITY_ROLE,
    LIST_SECURITY_ROLES,
    UPDATE_SECURITY_ROLE
} from "./graphql/roles";

import {
    CREATE_SECURITY_TEAM,
    DELETE_SECURITY_TEAM,
    GET_SECURITY_TEAM,
    LIST_SECURITY_TEAMS,
    UPDATE_SECURITY_TEAM
} from "./graphql/teams";

import {
    CREATE_API_KEY,
    DELETE_API_KEY,
    GET_API_KEY,
    LIST_API_KEYS,
    UPDATE_API_KEY
} from "./graphql/apiKeys";

import { INSTALL, IS_INSTALLED } from "./graphql/install";
import { LOGIN } from "./graphql/login";
import { customGroupAuthorizer } from "./mocks/customGroupAuthorizer";
import { customAuthenticator } from "./mocks/customAuthenticator";
import { triggerAuthentication } from "./mocks/triggerAuthentication";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import { createApiCore } from "~/index.js";
import { createRootTenantMock } from "./mocks/createRootTenantMock";
import { authenticateUsingHttpHeader } from "~/legacy/security/plugins/authenticateUsingHttpHeader.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";

type UseGqlHandlerParams = {
    plugins?: PluginCollection;
    wcpLicense?: DecryptedWcpProjectLicense;
};

export const useGqlHandler = (opts: UseGqlHandlerParams = {}) => {
    const defaults = { plugins: [] };
    opts = Object.assign({}, defaults, opts);

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");

    console.log(apiCoreStorage.storageOperations)
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: [
            apiCoreStorage.storageOperations,
            createApiCore({
                testProjectLicense: opts.wcpLicense
            }),
            graphqlHandlerPlugins(),
            createRootTenantMock(),
            triggerAuthentication(),
            authenticateUsingHttpHeader(),
            customAuthenticator(),
            customGroupAuthorizer(),
            opts.plugins
        ].filter(Boolean) as PluginCollection
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body = {}, headers = {}, ...rest }) => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            {} as LambdaContext
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const securityRole = {
        async create(variables = {}) {
            return invoke({ body: { query: CREATE_SECURITY_ROLE, variables } });
        },
        async update(variables = {}) {
            return invoke({ body: { query: UPDATE_SECURITY_ROLE, variables } });
        },
        async delete(variables = {}) {
            return invoke({ body: { query: DELETE_SECURITY_ROLE, variables } });
        },
        async list(variables = {}, headers = {}) {
            return invoke({ body: { query: LIST_SECURITY_ROLES, variables }, headers });
        },
        async get(variables = {}) {
            return invoke({ body: { query: GET_SECURITY_ROLE, variables } });
        }
    };
    const securityTeam = {
        async create(variables = {}) {
            return invoke({ body: { query: CREATE_SECURITY_TEAM, variables } });
        },
        async update(variables = {}) {
            return invoke({ body: { query: UPDATE_SECURITY_TEAM, variables } });
        },
        async delete(variables = {}) {
            return invoke({ body: { query: DELETE_SECURITY_TEAM, variables } });
        },
        async list(variables = {}, headers = {}) {
            return invoke({ body: { query: LIST_SECURITY_TEAMS, variables }, headers });
        },
        async get(variables = {}) {
            return invoke({ body: { query: GET_SECURITY_TEAM, variables } });
        }
    };

    const securityApiKeys = {
        async list(variables = {}) {
            return invoke({ body: { query: LIST_API_KEYS, variables } });
        },
        async get(variables = {}) {
            return invoke({ body: { query: GET_API_KEY, variables } });
        },
        async create(variables = {}) {
            return invoke({ body: { query: CREATE_API_KEY, variables } });
        },
        async update(variables = {}) {
            return invoke({ body: { query: UPDATE_API_KEY, variables } });
        },
        async delete(variables = {}) {
            return invoke({ body: { query: DELETE_API_KEY, variables } });
        }
    };

    const install = {
        async isInstalled() {
            return invoke({ body: { query: IS_INSTALLED } });
        },
        async install(headers = {}) {
            return invoke({
                body: { query: INSTALL, variables: { installationInput: [] } },
                headers
            });
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
        securityRole,
        securityTeam,
        securityApiKeys,
        install
    };
};

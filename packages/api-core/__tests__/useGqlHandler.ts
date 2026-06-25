import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { loadWcpLicense } from "~/features/wcp/loadWcpLicense.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import { TestAuthenticator } from "./mocks/TestAuthenticator.js";
import { TestAuthorizer } from "./mocks/TestAuthorizer.js";
import { AuthTriggerHandler } from "./handlers/AuthTriggerHandler.js";
import { RootTenantInitializer } from "./handlers/RootTenantInitializer.js";

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

type UseGqlHandlerParams = {
    registrations?: any[];
    wcpLicense?: DecryptedWcpProjectLicense;
};

export const useGqlHandler = (opts: UseGqlHandlerParams = {}) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");

    const handler = createTestHttpHandler({
        root: container => {
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);

            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(RootTenantInitializer);
        },
        request: async container => {
            // ApiCoreFeature in child container — TenantContext, IdentityContext etc.
            // registered here become per-request singletons automatically
            const wcpLicense = await loadWcpLicense(opts.wcpLicense);
            ApiCoreFeature.register(container, {
                ...apiCoreStorage.storageOperations,
                wcpLicense
            });
            GraphQLEngineFeature.register(container);

            for (const registration of opts.registrations ?? []) {
                // Arrow functions are setup callbacks; classes (which also have typeof "function")
                // have a prototype and are DI implementations → register in container
                if (typeof registration === "function" && !registration.prototype) {
                    await registration(container);
                } else {
                    container.register(registration);
                }
            }
        }
    });

    const invoke = async ({
        httpMethod = "POST",
        body = {},
        headers = {},
        path = "/graphql",
        ...rest
    }: any = {}) => {
        const response = await handler({
            method: httpMethod,
            path,
            headers: Object.fromEntries(
                Object.entries({
                    "x-tenant": "root",
                    "content-type": "application/json",
                    ...headers
                }).map(([k, v]) => [k.toLowerCase(), v])
            ),
            query: {},
            pathParameters: {},
            body,
            ...rest
        });

        return [response.body, response];
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

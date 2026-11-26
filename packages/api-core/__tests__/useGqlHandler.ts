import { createTestHttpHandler } from "@webiny/api-kernel-core/features/testing";
import type { Container } from "@webiny/di";
import { GraphQLEngineFeature } from "@webiny/api-graphql";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import { registerApiCoreStorageOperations } from "~/features/storageOperations/abstractions.js";
import { getStorageOps } from "~/testing/environment.js";
import { WcpLicenseLoader } from "~/features/wcp/WcpLicenseLoader.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import type { ApiCoreStorageOperationsBuilder } from "~/types/core.js";
import { TestAuthenticator } from "./mocks/TestAuthenticator.js";
import { TestAuthorizer } from "./mocks/TestAuthorizer.js";
import { AuthTriggerHandler } from "./handlers/AuthTriggerHandler.js";
import { TestHttpTenantSource } from "./handlers/TestHttpTenantSource.js";
import {
    TenantNeutralRequestFeature,
    TenantScopeRegistration,
    TenantScopesRootFeature
} from "~/features/tenancy/TenantScopes/index.js";

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
import { Logger } from "~/features/logger/index.js";
import { NullLogger } from "~/features/logger/index.js";
import { BuildParamsFeature } from "~/features/buildParams/feature.js";

type UseGqlHandlerParams = {
    registrations?: any[];
    /** Registrations in the root container, which outlives a single request. */
    rootRegistrations?: ((container: Container) => void)[];
    wcpLicense?: DecryptedWcpProjectLicense;
};

export const useGqlHandler = (opts: UseGqlHandlerParams = {}) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperationsBuilder>("apiCore");

    /*
     * Requests run the way the API runs them: the request container is tenant-neutral, and the
     * request continues in the scope of its `x-tenant` header's tenant, where everything below
     * `child`'s request part is registered.
     */
    const handler = createTestHttpHandler({
        root: container => {
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);

            container.registerDecorator(AuthTriggerHandler);
            BuildParamsFeature.register(container);
            TenantScopesRootFeature.register(container);
            container.register(TestHttpTenantSource);

            for (const registration of opts.rootRegistrations ?? []) {
                registration(container);
            }
        },
        child: async container => {
            const wcpLicense = await WcpLicenseLoader.load(opts.wcpLicense);
            registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
            const logger = new NullLogger();
            container.registerInstance(Logger, logger);
            TenantNeutralRequestFeature.register(container);

            container.registerInstance(TenantScopeRegistration, {
                register: async scope => {
                    // TenantContext, IdentityContext etc. registered here are the scope's singletons.
                    ApiCoreFeature.register(scope, { wcpLicense, tenantScope: true });
                    GraphQLEngineFeature.register(scope);

                    for (const registration of opts.registrations ?? []) {
                        // Arrow functions are setup callbacks; classes (which also have typeof
                        // "function") have a prototype and are DI implementations → register them.
                        if (typeof registration === "function" && !registration.prototype) {
                            await registration(scope);
                        } else {
                            scope.register(registration);
                        }
                    }
                }
            });
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

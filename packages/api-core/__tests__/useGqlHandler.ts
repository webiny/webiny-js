import { createTestHandler } from "@webiny/event-handler-core/testing";
import {
    HttpFeature,
    HttpRouterHandler,
    ErrorHandler,
    NotFoundHandler,
    HttpTenantIdExtractorImpl
} from "@webiny/event-handler-core";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import { LegacyContext as SecurityLegacyContext } from "~/legacy/security/LegacyContext.js";
import { LegacyContext as TenancyLegacyContext } from "~/legacy/tenancy/LegacyContext.js";
import { LegacyWcpContext } from "~/legacy/wcp/LegacyWcpContext.js";
import { ContextPlugin } from "@webiny/api";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
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
    plugins?: any[];
    schemaFactories?: any[];
};

export const useGqlHandler = (opts: UseGqlHandlerParams = {}) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");

    const handler = createTestHandler({
        root: async container => {
            ApiCoreFeature.register(container, apiCoreStorage.storageOperations);

            // Register any extra GraphQL schema factories
            for (const factory of opts.schemaFactories ?? []) {
                container.register(factory);
            }

            // Apply any ContextPlugin instances from opts.plugins
            // Provide a rich context so plugins can access security, tenancy, wcp, container
            const pluginContext = {
                container,
                security: new SecurityLegacyContext(container),
                tenancy: new TenancyLegacyContext(container),
                wcp: new LegacyWcpContext(container)
            };
            for (const plugin of opts.plugins ?? []) {
                if (plugin instanceof ContextPlugin) {
                    await plugin.apply(pluginContext as any);
                }
            }

            GraphQLEngineFeature.register(container);
            HttpFeature.register(container);

            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.register(HttpTenantIdExtractorImpl);

            container.register(ErrorHandler);
            container.register(RootTenantInitializer);
            container.register(AuthTriggerHandler);
            container.register(HttpRouterHandler);
            container.register(NotFoundHandler);
        },
        request: _container => {
            // TenantContext is a root singleton — RootTenantInitializer sets it on each request
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
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                ...headers
            },
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

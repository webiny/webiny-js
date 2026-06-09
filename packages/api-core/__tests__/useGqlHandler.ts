import { createTestHandler } from "@webiny/event-handler-core/testing";
import {
    HttpFeature,
    HttpRouterHandler,
    ErrorHandler,
    NotFoundHandler,
    HttpEventHandler,
    HttpTenantIdExtractorImpl
} from "@webiny/event-handler-core";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { ApiCoreFeature } from "~/ApiCoreFeature.js";
import { TenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import { LegacyContext as SecurityLegacyContext } from "~/legacy/security/LegacyContext.js";
import { LegacyContext as TenancyLegacyContext } from "~/legacy/tenancy/LegacyContext.js";
import { LegacyWcpContext } from "~/legacy/wcp/LegacyWcpContext.js";
import { Authenticator } from "~/features/security/authentication/Authenticator/abstractions.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/abstractions.js";
import { AuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { ContextPlugin } from "@webiny/api";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.public.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import type { IAuthenticator } from "~/features/security/authentication/Authenticator/abstractions.js";
import type { IAuthorizer } from "~/features/security/authorization/Authorizer/abstractions.js";

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

// --- Test authenticator: returns John Doe unless Authorization header is present ---

const TestAuthenticator = Authenticator.createImplementation({
    implementation: class implements IAuthenticator {
        async authenticate(token: string): Promise<any> {
            if (token) {
                return null; // let real authenticators handle tokens
            }
            return {
                id: "123456789",
                displayName: "John Doe",
                type: "admin",
                roles: ["full-access"],
                profile: { external: true }
            };
        }
    },
    dependencies: []
});

// --- Test authorizer: grants full access to full-access roles ---

const TestAuthorizer = Authorizer.createImplementation({
    implementation: class implements IAuthorizer {
        async authorize(identity: any): Promise<any> {
            if (identity?.roles?.includes("full-access")) {
                return [{ name: "*" }];
            }
            return null;
        }
    },
    dependencies: []
});

// --- Authentication trigger: authenticate on each request if no Authorization header ---

const AuthTriggerHandler = HttpEventHandler.createImplementation({
    implementation: class {
        constructor(
            private authCtx: AuthenticationContext.Interface,
            private identityCtx: IdentityContext.Interface
        ) {}

        async execute(ctx: EventContext, next: NextFunction): Promise<any> {
            const headers = ctx.event?.headers ?? {};
            if (!headers["authorization"]) {
                const identity = await this.authCtx.authenticate("");
                this.identityCtx.setIdentity(identity);
            }
            return next();
        }
    },
    dependencies: [AuthenticationContext, IdentityContext]
});

// --- Root tenant initializer: sets root tenant directly (no DB lookup needed in tests) ---

const RootTenantInitializer = HttpEventHandler.createImplementation({
    implementation: class {
        constructor(private tenantCtx: TenantContext.Interface) {}

        async execute(ctx: EventContext, next: NextFunction): Promise<any> {
            this.tenantCtx.setTenant({
                id: "root",
                name: "Root",
                description: "",
                status: "enabled",
                isInstalled: false,
                settings: {
                    name: { full: "Root", slug: "root" },
                    social: {},
                    favicon: {},
                    logo: {}
                } as any,
                tags: [],
                parent: null,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString()
            });
            return next();
        }
    },
    dependencies: [TenantContext]
});

// ---

type UseGqlHandlerParams = {
    plugins?: any[];
};

export const useGqlHandler = (opts: UseGqlHandlerParams = {}) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");

    const handler = createTestHandler({
        root: async container => {
            ApiCoreFeature.register(container, apiCoreStorage.storageOperations);

            // Register any GraphQLSchemaPlugin instances from opts.plugins as a schema factory
            const schemaPlugins = (opts.plugins ?? []).filter(
                p => p instanceof GraphQLSchemaPlugin
            ) as GraphQLSchemaPlugin[];
            if (schemaPlugins.length > 0) {
                const extraSchemaFactory = GraphQLSchemaFactory.createImplementation({
                    implementation: class {
                        async execute(builder: IGraphQLSchemaBuilder) {
                            for (const plugin of schemaPlugins) {
                                const schema = plugin.schema;
                                if (schema.typeDefs) {
                                    builder.addTypeDefs(schema.typeDefs);
                                }
                                if (schema.resolvers) {
                                    for (const [type, resolvers] of Object.entries(
                                        schema.resolvers as Record<string, any>
                                    )) {
                                        for (const [field, fn] of Object.entries(
                                            resolvers as Record<string, any>
                                        )) {
                                            const oldFn = fn as (...args: any[]) => any;
                                            builder.addResolver({
                                                path: `${type}.${field}`,
                                                dependencies: [],
                                                resolver:
                                                    () =>
                                                    ({ parent, args, context, info }: any) =>
                                                        oldFn(parent, args, context, info)
                                            });
                                        }
                                    }
                                }
                            }
                            return builder;
                        }
                    },
                    dependencies: []
                });
                container.register(extraSchemaFactory);
            }

            // Apply any ContextPlugin instances from opts.plugins
            // Provide a rich context so plugins can use security, tenancy, wcp, container
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

            // Test-only registrations
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.register(HttpTenantIdExtractorImpl);

            // HttpEventHandler chain
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

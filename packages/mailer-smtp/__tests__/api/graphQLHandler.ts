import { getIntrospectionQuery } from "graphql";
import { createTestHttpHandler } from "@webiny/api-kernel-core/features/testing";
import { GraphQLEngineFeature } from "@webiny/api-graphql";
import { ApiCoreFeature } from "@webiny/api-core/ApiCoreFeature.js";
import { registerApiCoreStorageOperations } from "@webiny/api-core";
import { MailerFeature } from "@webiny/api-mailer";
import { MailerSmtpFeature } from "~/api/MailerSmtpFeature.js";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { sleep } from "./context/helpers";
import { until } from "./context/helpers";
import { createPermissions } from "./context/helpers";
import type { CreateHandlerParams } from "./contextHandler";
import type { Identity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { GET_SETTINGS_QUERY } from "./graphql/settings";
import { SAVE_SETTINGS_MUTATION } from "./graphql/settings";
import { SEND_TEST_MAIL_MUTATION } from "./graphql/settings";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { NullLogger } from "@webiny/api-core/features/logger/index.js";

const tenantSettings: any = { domains: [] };

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

function createTestAuthorizer(permissions: SecurityPermission[]) {
    class TestAuthorizerImpl implements Authorizer.Interface {
        async authorize(_identity: Identity): Promise<SecurityPermission[] | null> {
            return permissions as SecurityPermission[];
        }
    }
    return Authorizer.createImplementation({
        implementation: TestAuthorizerImpl,
        dependencies: []
    });
}

export const createGraphQLHandler = (params?: CreateHandlerParams) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const permissions = createPermissions(params?.permissions) as SecurityPermission[];
    const identityData = params?.identity ?? {
        id: "12345678",
        displayName: "John Doe",
        type: "admin"
    };

    const handler = createTestHttpHandler({
        root: container => {
            const authorizer = createTestAuthorizer(permissions);
            container.register(authorizer);
        },
        child: async container => {
            registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
            const logger = new NullLogger();
            container.registerInstance(Logger, logger);
            ApiCoreFeature.register(container, {});
            GraphQLEngineFeature.register(container);
            MailerFeature.register(container);
            MailerSmtpFeature.register(container);

            /*
             * Apply additional plugins (for example registerCodeSmtpSettings). DI-native plugins are
             * plain `container => {}` functions; legacy ContextPlugins expose a custom `apply(ctx)`.
             * Check for a function first: a plain function also has `Function.prototype.apply`, which
             * would otherwise be called with no arguments.
             */
            const additionalPlugins = [params?.plugins ?? []].flat(Infinity as 1).filter(Boolean);
            const ctx: Record<string, any> = { container };
            for (const plugin of additionalPlugins as any[]) {
                if (typeof plugin === "function" && !plugin.prototype) {
                    plugin(container);
                } else if (typeof plugin.apply === "function") {
                    await plugin.apply(ctx);
                }
            }

            // Set up the root tenant.
            const tenantCtx = container.resolve(TenantContext);
            tenantCtx.setTenant({
                id: "root",
                name: "Root",
                description: "",
                status: "enabled",
                isInstalled: false,
                settings: tenantSettings,
                tags: [],
                parent: null,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString()
            });

            // Set up a test identity.
            const identityCtx = container.resolve(IdentityContext);
            const identity = new AuthenticatedIdentity(identityData);
            identityCtx.setIdentity(identity);
        }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler({
            method: httpMethod,
            path: "/graphql",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                ...headers
            },
            body,
            ...rest
        } as any);

        if (httpMethod === "OPTIONS" && !response.body) {
            return [null, response];
        }
        return [response.body, response];
    };

    return {
        until,
        sleep,
        handler,
        invoke,
        async introspect() {
            const query = getIntrospectionQuery();
            return invoke({ body: { query } });
        },
        async getSettings() {
            return invoke({ body: { query: GET_SETTINGS_QUERY } });
        },
        async saveSettings(variables: Record<string, any>) {
            return invoke({ body: { query: SAVE_SETTINGS_MUTATION, variables } });
        },
        async sendTestMail(variables: { to: string }) {
            return invoke({ body: { query: SEND_TEST_MAIL_MUTATION, variables } });
        }
    };
};

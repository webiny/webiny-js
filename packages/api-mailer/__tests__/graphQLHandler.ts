import { getIntrospectionQuery } from "graphql";
import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { ApiCoreFeature } from "@webiny/api-core/ApiCoreFeature.js";
import { MailerFeature } from "~/MailerFeature.js";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import {
    IdentityContext,
    AuthenticatedIdentity
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { sleep, until, createPermissions } from "./context/helpers";
import type { CreateHandlerParams } from "./handlerPlugins";
import type { IAuthorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { Identity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { GET_SETTINGS_QUERY, SAVE_SETTINGS_MUTATION } from "./graphql/settings";

// contextSecurity kept for external imports (handlerPlugins.ts uses it)
export const contextSecurity = (_params: any) => [];

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

function createTestAuthorizer(permissions: SecurityPermission[]) {
    class TestAuthorizerImpl implements IAuthorizer {
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
            container.register(createTestAuthorizer(permissions));
        },
        request: async container => {
            ApiCoreFeature.register(container, apiCoreStorage.storageOperations);
            GraphQLEngineFeature.register(container);
            MailerFeature.register(container);

            // Apply additional plugins (e.g. registerCodeSmtpSettings)
            const additionalPlugins = [params?.plugins ?? []].flat(Infinity as 1).filter(Boolean);
            const ctx: Record<string, any> = { container };
            for (const plugin of additionalPlugins as any[]) {
                if (typeof plugin.apply === "function") {
                    await plugin.apply(ctx);
                }
            }

            // Set up root tenant
            const tenantCtx = container.resolve(TenantContext);
            tenantCtx.setTenant({
                id: "root",
                name: "Root",
                description: "",
                status: "enabled",
                isInstalled: false,
                settings: { domains: [] } as any,
                tags: [],
                parent: null,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString()
            });

            // Set up test identity
            const identityCtx = container.resolve(IdentityContext);
            identityCtx.setIdentity(new AuthenticatedIdentity(identityData));
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
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        async getSettings() {
            return invoke({ body: { query: GET_SETTINGS_QUERY } });
        },
        async saveSettings(variables: Record<string, any>) {
            return invoke({ body: { query: SAVE_SETTINGS_MUTATION, variables } });
        }
    };
};

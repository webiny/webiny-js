/*
 * No createTestHttpHandler here. Context tests call use cases directly on the container, without
 * HTTP. createTestHttpHandler starts an HTTP router and needs a POST /graphql call, which only
 * graphQLHandler.ts needs, since it tests the full request and response.
 */
import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
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
import { until } from "./context/helpers";
import { sleep } from "./context/helpers";
import { createPermissions } from "./context/helpers";
import type { PermissionsArg } from "./context/helpers";
import type { Plugin } from "@webiny/plugins/types";
import type { PluginCollection } from "@webiny/plugins/types";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { Identity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { NullLogger } from "@webiny/api-core/features/logger/index.js";

const tenantSettings: any = { domains: [] };

export type ContainerPlugin = (container: Container) => void;

export type HandlerPlugin = Plugin | ContainerPlugin | PluginCollection;

export interface CreateHandlerParams {
    permissions?: PermissionsArg[];
    identity?: IdentityData;
    plugins?: HandlerPlugin | HandlerPlugin[] | HandlerPlugin[][];
}

function createTestAuthorizer(permissions: PermissionsArg[]) {
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

export const createContextHandler = (params?: CreateHandlerParams) => {
    return {
        until,
        sleep,
        handle: async (): Promise<ApiCoreContext> => {
            const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");

            const root = new Container();
            const child = root.createChildContainer();
            child.registerInstance(RequestContainer, child);

            registerApiCoreStorageOperations(child, apiCoreStorage.storageOperations);
            const logger = new NullLogger();
            child.registerInstance(Logger, logger);
            ApiCoreFeature.register(child, {});
            MailerFeature.register(child);
            MailerSmtpFeature.register(child);

            const permissions = createPermissions(params?.permissions);
            const authorizer = createTestAuthorizer(permissions);
            child.register(authorizer);

            const ctx: Record<string, any> = { container: child };

            /*
             * Apply additional plugins (for example registerCodeSmtpSettings). DI-native plugins are
             * plain `container => {}` functions; legacy ContextPlugins expose `apply(ctx)`.
             */
            const additionalPlugins = [params?.plugins ?? []].flat(Infinity as 1).filter(Boolean);
            for (const plugin of additionalPlugins as any[]) {
                if (typeof plugin === "function" && !plugin.prototype) {
                    plugin(child);
                } else if (typeof plugin.apply === "function") {
                    await plugin.apply(ctx);
                }
            }

            // Set up the root tenant, so the KeyValueStore and other tenant-scoped services work.
            const tenantCtx = child.resolve(TenantContext);
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

            // Set up a test identity, so use cases that check permissions work.
            const identityCtx = child.resolve(IdentityContext);
            const identityData = params?.identity ?? {
                id: "12345678",
                displayName: "John Doe",
                type: "admin"
            };
            const identity = new AuthenticatedIdentity(identityData);
            identityCtx.setIdentity(identity);

            return ctx as unknown as ApiCoreContext;
        }
    };
};

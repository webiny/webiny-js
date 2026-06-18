import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
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
import { until, sleep, createPermissions } from "./context/helpers";
import type { PermissionsArg } from "./context/helpers";
import type { CreateHandlerParams } from "./handlerPlugins";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { IAuthorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { Identity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

function createTestAuthorizer(permissions: PermissionsArg[]) {
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

export const createContextHandler = (params?: CreateHandlerParams) => {
    return {
        until,
        sleep,
        handle: async (): Promise<ApiCoreContext> => {
            const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");

            const root = new Container();
            const child = root.createChildContainer();
            child.registerInstance(RequestContainer, child);

            ApiCoreFeature.register(child, apiCoreStorage.storageOperations);
            MailerFeature.register(child);

            const permissions = createPermissions(params?.permissions);
            child.register(createTestAuthorizer(permissions));

            const ctx: Record<string, any> = { container: child };

            // Apply additional plugins (e.g. registerCodeSmtpSettings)
            const additionalPlugins = [params?.plugins ?? []].flat(Infinity as 1).filter(Boolean);
            for (const plugin of additionalPlugins as any[]) {
                if (typeof plugin.apply === "function") {
                    await plugin.apply(ctx);
                }
            }

            // Set up root tenant so KeyValueStore and other tenant-scoped services work
            const tenantCtx = child.resolve(TenantContext);
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

            // Set up test identity so use cases that check permissions work
            const identityCtx = child.resolve(IdentityContext);
            const identityData = params?.identity ?? {
                id: "12345678",
                displayName: "John Doe",
                type: "admin"
            };
            identityCtx.setIdentity(new AuthenticatedIdentity(identityData));

            return ctx as unknown as ApiCoreContext;
        }
    };
};

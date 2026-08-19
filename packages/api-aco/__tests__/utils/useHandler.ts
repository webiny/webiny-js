import { Container } from "@webiny/di";
import { RequestContainer, RequestContextInitializer } from "@webiny/event-handler-core";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { GraphQLContextEnhancer, GraphQLContextualSchema } from "@webiny/api-graphql";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { FileModel } from "@webiny/api-file-manager/domain/file/file.model.js";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { AcoFeature } from "~/index";
import { createIdentity } from "@webiny/api-core-testing";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { TestIdentity, TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions, TestAuthorizer } from "@webiny/api-core-testing";
import type { AcoContext } from "~/types";

export interface UseHandlerParams {
    permissions?: SecurityPermission[];
}

export const useHandler = (params: UseHandlerParams = {}) => {
    const { permissions = [{ name: "*" }] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const apiAcoStorage = getStorageOps<any>("aco");
    const cmsStorage = getStorageOps("cms");

    const resolvedIdentity = createIdentity();
    const resolvedPermissions = permissions;

    // Root container is created once; child containers are per-call (mirrors createHandler).
    let rootContainer: Container | null = null;

    const buildContext = async (): Promise<AcoContext> => {
        if (!rootContainer) {
            rootContainer = new Container();
            rootContainer.registerInstance(TestIdentity, resolvedIdentity);
            rootContainer.registerInstance(TestPermissions, { list: resolvedPermissions });
            rootContainer.register(TestAuthenticator);
            rootContainer.register(TestAuthorizer);
        }

        const container = rootContainer.createChildContainer();
        container.registerInstance(RequestContainer, container);

        const wcpLicense = await loadWcpLicense(createTestWcpLicense());
        registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
        ApiCoreFeature.register(container, { wcpLicense });
        processLegacyPlugins(container, apiAcoStorage.plugins);
        processLegacyPlugins(container, cmsStorage.plugins);
        HeadlessCmsFeature.register(container, { type: "manage" });
        container.register(FileModel);
        AcoFeature.register(container);

        // Set tenant before enhancers run (replicates RootTenantInitializer).
        const tenantCtx = container.resolve(TenantContext);
        tenantCtx.setTenant({
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

        // Authenticate and set identity (replicates AuthTriggerHandler).
        const authCtx = container.resolve(AuthenticationContext);
        const identityCtx = container.resolve(IdentityContext);
        const identity = await authCtx.authenticate("");
        identityCtx.setIdentity(identity);

        // Build context by running all GraphQL context enhancers, then contextual schemas
        // (replicates GraphQLEngineImpl.buildContext + CmsGraphQLRoute.handle order).
        const enhancers = container.resolveAll(GraphQLContextEnhancer);
        const initializers = container.resolveAll(RequestContextInitializer);
        const contextualSchemas = container.resolveAll(GraphQLContextualSchema);
        const ctx: Record<string, any> = { container };
        for (const enhancer of enhancers) {
            await enhancer.enhance(ctx);
        }
        for (const initializer of initializers) {
            await initializer.init(ctx);
        }
        for (const schema of contextualSchemas) {
            await schema.build(ctx);
        }

        return ctx as AcoContext;
    };

    return {
        handler: buildContext
    };
};

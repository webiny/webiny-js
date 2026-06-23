import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { ApiCoreFeature } from "@webiny/api-core";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { FileModel } from "@webiny/api-file-manager/domain/file/file.model.js";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { AcoFeature } from "@webiny/api-aco";
import { AuditLogsFeature } from "~/index";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import { TestIdentity, TestAuthenticator } from "./mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "./mocks/TestAuthorizer";
import type { AuditLogsContext } from "~/types";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";

export interface UseHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData | null;
}

const DEFAULT_IDENTITY: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export const useHandler = (params: UseHandlerParams = {}) => {
    const { permissions = [{ name: "*" }], identity } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const apiAcoStorage = getStorageOps<any>("aco");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const auditLogsStorage = getStorageOps<any>("auditLogs");

    const resolvedIdentity = identity === undefined ? DEFAULT_IDENTITY : identity;
    const resolvedPermissions = permissions;

    // Root container created once; child containers are per-call (mirrors createHandler).
    let rootContainer: Container | null = null;

    const buildContext = async (): Promise<AuditLogsContext> => {
        if (!rootContainer) {
            rootContainer = new Container();
            rootContainer.registerInstance(TestIdentity, resolvedIdentity);
            rootContainer.registerInstance(TestPermissions, resolvedPermissions);
            rootContainer.register(TestAuthenticator);
            rootContainer.register(TestAuthorizer);
        }

        const container = rootContainer.createChildContainer();
        container.registerInstance(RequestContainer, container);

        const testProjectLicense = createTestWcpLicense();
        testProjectLicense.package.features["auditLogs"].enabled = true;
        const wcpLicense = await loadWcpLicense(testProjectLicense);

        ApiCoreFeature.register(container, { ...apiCoreStorage.storageOperations, wcpLicense });
        processLegacyPlugins(container, apiAcoStorage.plugins);
        processLegacyPlugins(container, cmsStorage.plugins);
        // CompressionFeature must be registered before the audit logs DDB legacy plugin
        // runs, because that plugin eagerly resolves CompressionHandler from the container.
        CompressionFeature.register(container);
        processLegacyPlugins(container, auditLogsStorage.plugins);
        HeadlessCmsFeature.register(container, { type: "manage" });
        container.register(FileModel);
        AcoFeature.register(container);
        AuditLogsFeature.register(container);

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
        const authenticatedIdentity = await authCtx.authenticate("");
        identityCtx.setIdentity(authenticatedIdentity);

        // Build context by running all GraphQL context enhancers.
        const enhancers = container.resolveAll(GraphQLContextEnhancer);
        const ctx: Record<string, any> = { container };
        for (const enhancer of enhancers) {
            await enhancer.enhance(ctx);
        }

        return ctx as AuditLogsContext;
    };

    return {
        handler: buildContext
    };
};

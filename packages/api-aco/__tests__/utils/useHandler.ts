import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { FileModel } from "@webiny/api-file-manager/domain/file/file.model.js";
import { WcpLicenseLoader } from "@webiny/api-core/features/wcp/WcpLicenseLoader.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Result } from "@webiny/feature/api";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-core/features/websockets/index.js";
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
import { InlineTaskServiceFeature } from "@webiny/api-core-testing";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { NullLogger } from "@webiny/api-core/features/logger/index.js";

export interface SentWebsocketMessage {
    identityId: string;
    action: string;
    data: unknown;
}

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

    // What the code under test sent to users' open tabs. There is no socket server in tests, so the
    // send is recorded instead of delivered.
    const websocketMessages: SentWebsocketMessage[] = [];

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

        const wcpLicense = await WcpLicenseLoader.load(createTestWcpLicense());
        registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
        const logger = new NullLogger();
        container.registerInstance(Logger, logger);
        ApiCoreFeature.register(container, { wcpLicense });
        /*
         * In the request container: api-core registers a no-op send there, which would shadow a
         * recorder registered in the root.
         */
        container.registerInstance(WebsocketsSendToIdentityUseCase, {
            execute: async (identity, data) => {
                websocketMessages.push({
                    identityId: identity.id,
                    action: data.action,
                    data: data.data
                });
                return Result.ok();
            }
        });
        processLegacyPlugins(container, apiAcoStorage.plugins);
        processLegacyPlugins(container, cmsStorage.plugins);
        HeadlessCmsFeature.register(container, { type: "manage" });
        container.register(FileModel);
        AcoFeature.register(container);
        // Tasks run inside trigger(), so a test sees their effects when the call returns.
        InlineTaskServiceFeature.register(container);

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

        const ctx: Record<string, any> = { container };
        return ctx as AcoContext;
    };

    return {
        handler: buildContext,
        websocketMessages
    };
};

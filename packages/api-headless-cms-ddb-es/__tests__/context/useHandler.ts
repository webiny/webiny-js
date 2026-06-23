import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateTenantUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { RegisterExtensionPlugin } from "@webiny/handler";
import { createBackgroundTaskContext } from "@webiny/background-tasks/api";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import type { CmsContext } from "~/types";
import { TestIdentity, TestAuthenticator } from "~tests/mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "~tests/mocks/TestAuthorizer";
import { processLegacyPlugins } from "~tests/helpers/bridgeLegacyPlugins";

export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: SecurityPermission[];
    identity?: IdentityData;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    bottomPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path?: string;
}

export const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

// Root container is created once across all handler() calls.
let rootContainer: Container | null = null;

export const useHandler = <C extends CmsContext = CmsContext>(params: CreateHandlerCoreParams) => {
    const elasticsearchClient = createTestOpenSearchClient();

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const resolvedIdentity = params.identity ?? defaultIdentity;
    const resolvedPermissions = (params.permissions ?? [{ name: "*" }]) as SecurityPermission[];

    const flatPlugins = ([params.plugins ?? []].flat(Infinity as 1) as any[]).filter(Boolean);
    const legacyPlugins = flatPlugins.filter(p => p instanceof RegisterExtensionPlugin);
    const extraCmsPlugins = flatPlugins.filter(p => !(p instanceof RegisterExtensionPlugin));

    const buildContext = async (): Promise<C> => {
        if (!rootContainer) {
            rootContainer = new Container();
            rootContainer.registerInstance(TestIdentity, resolvedIdentity);
            rootContainer.registerInstance(TestPermissions, resolvedPermissions);
            rootContainer.register(TestAuthenticator);
            rootContainer.register(TestAuthorizer);
        }

        const container = rootContainer.createChildContainer();
        container.registerInstance(RequestContainer, container);

        const wcpLicense = await loadWcpLicense(createTestWcpLicense());
        ApiCoreFeature.register(container, { ...apiCoreStorage.storageOperations, wcpLicense });
        processLegacyPlugins(container, cmsStorage.plugins);
        processLegacyPlugins(container, legacyPlugins);

        HeadlessCmsFeature.register(container, {
            type: "manage",
            extraPlugins: extraCmsPlugins
        });

        // Create test tenants in DynamoDB so listTenantsUseCase returns them (mirrors old createTenancyAndSecurity).
        const testTenants = [
            { id: "root", name: "Root", parent: "" },
            { id: "webiny", name: "Webiny", parent: "" },
            { id: "dev", name: "Dev", parent: "" },
            { id: "sales", name: "Sales", parent: "" }
        ];
        container.registerFactory(GraphQLContextEnhancer, () => ({
            async enhance(): Promise<void> {
                const createTenantUseCase = container.resolve(CreateTenantUseCase);
                for (const tenant of testTenants) {
                    try {
                        await createTenantUseCase.execute(tenant);
                    } catch {
                        // Tenant may already exist in DynamoDB
                    }
                }
            }
        }));

        // Background task context needs to run after ApiCore and CMS enhancers.
        // Separate into: RegisterExtensionPlugin (apply now) and other plugins (apply in factory enhancer).
        // Factory registrations run last in resolveAll, ensuring correct ordering.
        const bgPlugins = ([createBackgroundTaskContext()].flat(Infinity as 1) as any[]).filter(
            Boolean
        );
        processLegacyPlugins(
            container,
            bgPlugins.filter(p => p instanceof RegisterExtensionPlugin)
        );
        const bgOtherPlugins = bgPlugins.filter(p => !(p instanceof RegisterExtensionPlugin));

        container.registerFactory(GraphQLContextEnhancer, () => ({
            async enhance(ctx: Record<string, any>): Promise<void> {
                for (const plugin of bgOtherPlugins) {
                    if (typeof (plugin as any).apply === "function") {
                        await (plugin as any).apply(ctx);
                    } else if (ctx.plugins && plugin) {
                        ctx.plugins.register(plugin);
                    }
                }
            }
        }));

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

        const authCtx = container.resolve(AuthenticationContext);
        const identityCtx = container.resolve(IdentityContext);
        const identity = await authCtx.authenticate("");
        identityCtx.setIdentity(identity);

        const enhancers = container.resolveAll(GraphQLContextEnhancer);
        const ctx: Record<string, any> = { container };
        for (const enhancer of enhancers) {
            await enhancer.enhance(ctx);
        }

        return ctx as C;
    };

    return {
        elasticsearch: elasticsearchClient,
        handler: (_payload?: any) => buildContext()
    };
};

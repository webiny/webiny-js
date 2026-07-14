import { Container } from "@webiny/di";
import { RequestContainer, RequestContextInitializer } from "@webiny/event-handler-core";
import { GraphQLContextEnhancer, GraphQLContextualSchema } from "@webiny/handler-graphql";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateTenantUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { RegisterExtensionPlugin } from "@webiny/handler";
import { BackgroundTasksFeature, TasksCrud } from "@webiny/background-tasks/api";
import { ElasticsearchTasksFeature } from "@webiny/api-elasticsearch-tasks";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import type { CmsContext } from "~/types";
import { TestIdentity, TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions, TestAuthorizer } from "@webiny/api-core-testing";
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
            rootContainer.registerInstance(TestPermissions, { list: resolvedPermissions });
            rootContainer.register(TestAuthenticator);
            rootContainer.register(TestAuthorizer);
        }

        const container = rootContainer.createChildContainer();
        container.registerInstance(RequestContainer, container);

        const wcpLicense = await loadWcpLicense(createTestWcpLicense());
        registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
        ApiCoreFeature.register(container, { wcpLicense });
        processLegacyPlugins(container, cmsStorage.plugins);
        processLegacyPlugins(container, legacyPlugins);

        HeadlessCmsFeature.register(container, {
            type: "manage",
            extraPlugins: extraCmsPlugins
        });

        const createTenantUseCase = container.resolve(CreateTenantUseCase);
        for (const tenant of [
            { id: "root", name: "Root", parent: "" },
            { id: "webiny", name: "Webiny", parent: "" },
            { id: "dev", name: "Dev", parent: "" },
            { id: "sales", name: "Sales", parent: "" }
        ]) {
            try {
                await createTenantUseCase.execute(tenant);
            } catch {
                // Tenant may already exist in DynamoDB
            }
        }

        // Background tasks are DI-native — the feature registers models, TasksCrud, and the GraphQL
        // contextual schema (built below alongside the other contextual schemas). The OpenSearch
        // Elasticsearch task definitions come from ElasticsearchTasksFeature.
        BackgroundTasksFeature.register(container);
        ElasticsearchTasksFeature.register(container);

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
        const initializers = container.resolveAll(RequestContextInitializer);
        for (const initializer of initializers) {
            await initializer.init(ctx);
        }
        const schemas = container.resolveAll(GraphQLContextualSchema);
        for (const schema of schemas) {
            await schema.build(ctx);
        }

        // DI-native source for the legacy `context.tasks` service-locator: resolve the CRUD
        // aggregate from the container and expose it on the captured context. See the "full-DI
        // tasks" cleanup note to retire this bridge.
        const [tasksCrud] = container.resolveAll(TasksCrud);
        if (tasksCrud) {
            ctx.tasks = tasksCrud;
        }

        return ctx as C;
    };

    return {
        elasticsearch: elasticsearchClient,
        handler: (_payload?: any) => buildContext()
    };
};

import { type Container, createFeature } from "@webiny/feature/api";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";
import {
    ModelBuilderFeature,
    ModelsProvider
} from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { StorageFeature } from "@webiny/api-headless-cms/features/storage/index.js";
import { ContentModelFeature } from "@webiny/api-headless-cms/features/contentModel/ContentModelFeature.js";
import { ContentEntriesFeature } from "@webiny/api-headless-cms/features/contentEntry/ContentEntriesFeature.js";
import { CmsWhereMapperFeature } from "@webiny/api-headless-cms/features/whereMapper/feature.js";
import { CmsSortMapperFeature } from "@webiny/api-headless-cms/features/sortMapper/feature.js";
import {
    StorageOperationsFactory,
    StorageOperations,
    AccessControl
} from "@webiny/api-headless-cms/features/shared/abstractions.js";
import {
    EntryFromStorageTransform,
    EntryToStorageTransform,
    SearchableFieldsProvider
} from "@webiny/api-headless-cms/legacy/abstractions.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { PluginsContainer } from "@webiny/plugins";
import { createFieldConverters } from "@webiny/api-headless-cms/fieldConverters/index.js";
import { entryFromStorageTransform } from "@webiny/api-headless-cms/utils/entryStorage.js";
import { createWebsiteBuilder } from "./index.js";
import { WebsiteBuilderRedirectsRoute } from "./rest/WebsiteBuilderRedirectsRoute.js";
import { GetActiveRedirectsFeature } from "./features/redirects/GetActiveRedirects/feature.js";
import { ListRedirectsFeature } from "./features/redirects/ListRedirects/feature.js";
import { WbPermissionsFeature } from "./features/permissions/feature.js";
import { PAGE_MODEL_ID } from "~/domain/page/page.model.js";
import { REDIRECT_MODEL_ID } from "~/domain/redirect/redirect.model.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { RedirectModel } from "~/domain/redirect/abstractions.js";
import { PageModelPlugin } from "~/domain/page/page.model.js";
import { RedirectModelPlugin } from "~/domain/redirect/redirect.model.js";

export const WebsiteBuilderFeature = createFeature({
    name: "WebsiteBuilder",
    register(container: Container) {
        WbPermissionsFeature.register(container);
        ListRedirectsFeature.register(container);
        GetActiveRedirectsFeature.register(container);
        container.register(WebsiteBuilderRedirectsRoute);

        // Register CMS features needed by the redirect REST route (before enhance() runs).
        // When HeadlessCmsContextEnhancer.enhance() runs for GraphQL requests, it will
        // overwrite StorageOperations/AccessControl with full-context versions (last-wins).
        CompressionFeature.register(container);
        StorageFeature.register(container);
        ModelBuilderFeature.register(container);
        ContentModelFeature.register(container);
        ContentEntriesFeature.register(container);
        CmsWhereMapperFeature.register(container);
        CmsSortMapperFeature.register(container);

        // Register WB model factories so ModelsProvider can build CmsModel instances.
        container.register(PageModelPlugin);
        container.register(RedirectModelPlugin);

        const plugins = createWebsiteBuilder().flat(Infinity as 1);
        let initialized = false;

        const enhancer: IGraphQLContextEnhancer = {
            async enhance(ctx: Record<string, any>): Promise<void> {
                if (initialized) {
                    return;
                }
                initialized = true;

                for (const plugin of plugins) {
                    if (plugin && typeof (plugin as any).apply === "function") {
                        await (plugin as any).apply(ctx);
                    } else if (ctx.plugins) {
                        ctx.plugins.register(plugin);
                    }
                }
            }
        };

        container.registerInstance(GraphQLContextEnhancer, enhancer);
    }
});

/**
 * Bootstraps the WB CMS infrastructure and registers PageModel/RedirectModel in the container.
 * Must be called in the `request` callback of createLambdaHandler, after
 * WebsiteBuilderFeature.register() and HeadlessCmsFeature.register().
 *
 * For GraphQL requests, HeadlessCmsContextEnhancer.enhance() will later overwrite the minimal
 * StorageOperations/AccessControl with proper full-context versions. For REST routes (e.g.
 * GET /wb/redirects), the minimal bootstrap is sufficient.
 */
export async function setupWebsiteBuilderModels(container: Container): Promise<void> {
    // Create a minimal PluginsContainer with field converters for DDB storage operations.
    const plugins = new PluginsContainer([...createFieldConverters()]);

    // Bootstrap StorageOperations using the DDB factory. The table name comes from
    // process.env.DB_TABLE_HEADLESS_CMS || process.env.DB_TABLE (resolved inside createTable).
    const storageOpsFactory = container.resolve(StorageOperationsFactory);
    const storageOps = await storageOpsFactory.create({ plugins, container } as any);
    container.registerInstance(StorageOperations, storageOps);

    // Bypass AccessControl — the redirect route enforces auth at the route level.
    // HeadlessCmsContextEnhancer.enhance() will overwrite this with a proper security-aware
    // AccessControl for GraphQL requests.
    container.registerInstance(AccessControl, {
        canAccessModel: async () => true,
        canAccessGroup: async () => true
    } as any);

    // Provide the entry storage transform using the DI container directly (no legacy ctx needed).
    container.registerInstance(EntryFromStorageTransform, ((model: any, entry: any) =>
        entryFromStorageTransform({ container }, model, entry)) as any);
    // Identity transform for writes — this feature is read-only for redirects.
    container.registerInstance(EntryToStorageTransform, ((_model: any, entry: any) =>
        Promise.resolve(entry)) as any);

    // Return all fields as searchable (sufficient for simple text/boolean redirect fields).
    container.registerInstance(SearchableFieldsProvider, ({ fields }: { fields: any[] }) =>
        fields.map((f: any) => f.fieldId)
    );

    // Build and register WB CmsModel instances from the ModelFactory plugins.
    const modelsProvider = container.resolve(ModelsProvider);
    const tenantCtx = container.resolve(TenantContext);
    // At request-callback time the tenant may not be set yet (it's populated during routing
    // by ApiGatewaySecurityDecorators). Fall back to "root" for plugin-model building — the
    // actual per-request tenant will be correct when DynamoDB queries run later.
    // getTenant() is typed non-null but returns null before the tenant is set during routing.
    const tenantId = (tenantCtx.getTenant() as any)?.id ?? "root";
    const models = await modelsProvider.list(tenantId);

    const redirectModel = models.find(m => m.modelId === REDIRECT_MODEL_ID);
    const pageModel = models.find(m => m.modelId === PAGE_MODEL_ID);

    if (redirectModel) {
        container.registerInstance(RedirectModel, redirectModel);
    }
    if (pageModel) {
        container.registerInstance(PageModel, pageModel);
    }
}

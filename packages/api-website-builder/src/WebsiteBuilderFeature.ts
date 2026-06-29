import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import {
    ModelBuilderFeature,
    ModelsProvider
} from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { StorageFeature } from "@webiny/api-headless-cms/features/storage/index.js";
import { ContentModelFeature } from "@webiny/api-headless-cms/features/contentModel/ContentModelFeature.js";
import { ContentEntriesFeature } from "@webiny/api-headless-cms/features/contentEntry/ContentEntriesFeature.js";
import { CmsWhereMapperFeature } from "@webiny/api-headless-cms/features/whereMapper/feature.js";
import { CmsSortMapperFeature } from "@webiny/api-headless-cms/features/sortMapper/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
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

        // Register CMS features needed by the redirect REST route (before the CMS schema builds).
        // When the CMS contextual schema (HeadlessCmsInitializer.build()) runs for GraphQL requests,
        // it will overwrite StorageOperations/AccessControl with full-context versions (last-wins).
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

        registerLegacyPluginsViaGqlContextualSchema(container, createWebsiteBuilder());
    }
});

/**
 * Resolves the WB CmsModel instances (Page/Redirect) from the registered ModelFactory plugins and
 * exposes them by token for the redirect REST route + page features. Must run in the `request`
 * callback after WebsiteBuilderFeature.register() and HeadlessCmsFeature.register().
 *
 * Storage operations, AccessControl, the entry transforms and SearchableFieldsProvider are now
 * provided by HeadlessCmsFeature.register() for every event, so WB no longer builds its own
 * (which previously meant a permissive AccessControl stub that shadowed the real one).
 */
export async function setupWebsiteBuilderModels(container: Container): Promise<void> {
    // Build the WB CmsModel instances from the registered ModelFactory plugins.
    const modelsProvider = container.resolve(ModelsProvider);
    const tenantCtx = container.resolve(TenantContext);
    // getTenant() is typed non-null but returns null before the tenant is set during routing;
    // fall back to "root" for code-defined model building (the per-request tenant is applied later
    // when DynamoDB queries run).
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

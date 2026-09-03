import { type Container, createFeature } from "@webiny/feature/api";
import { RequestContextInitializer } from "@webiny/event-handler-core";
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
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WebsiteBuilderRedirectsRoute } from "./rest/WebsiteBuilderRedirectsRoute.js";
import { registerWebsiteBuilderGraphQL } from "./graphql/createGraphQL.js";
// Redirects
import { GetRedirectByIdFeature } from "./features/redirects/GetRedirectById/feature.js";
import { ListRedirectsFeature } from "./features/redirects/ListRedirects/feature.js";
import { GetActiveRedirectsFeature } from "./features/redirects/GetActiveRedirects/feature.js";
import { CreateRedirectFeature } from "./features/redirects/CreateRedirect/feature.js";
import { UpdateRedirectFeature } from "./features/redirects/UpdateRedirect/feature.js";
import { DeleteRedirectFeature } from "./features/redirects/DeleteRedirect/feature.js";
import { MoveRedirectFeature } from "./features/redirects/MoveRedirect/feature.js";
import { InvalidateRedirectsCacheFeature } from "./features/redirects/InvalidateRedirectsCache/feature.js";
// Pages
import { GetPageByIdFeature } from "./features/pages/GetPageById/feature.js";
import { GetPageByPathFeature } from "./features/pages/GetPageByPath/feature.js";
import { GetPageRevisionsFeature } from "./features/pages/GetPageRevisions/feature.js";
import { GetDeletedPageByIdFeature } from "./features/pages/GetDeletedPageById/feature.js";
import { GetPageLanguagePathsFeature } from "./features/pages/GetPageLanguagePaths/feature.js";
import { ListPagesFeature } from "./features/pages/ListPages/feature.js";
import { ListDeletedPagesFeature } from "./features/pages/ListDeletedPages/feature.js";
import { CreatePageFeature } from "./features/pages/CreatePage/feature.js";
import { CreatePageRevisionFromFeature } from "./features/pages/CreatePageRevisionFrom/feature.js";
import { DeletePageFeature } from "./features/pages/DeletePage/feature.js";
import { TrashPageFeature } from "./features/pages/TrashPage/feature.js";
import { RestorePageFeature } from "./features/pages/RestorePage/feature.js";
import { UpdatePageFeature } from "./features/pages/UpdatePage/feature.js";
import { UpdatePageRevisionDescriptionFeature } from "./features/pages/UpdatePageRevisionDescription/feature.js";
import { PublishPageFeature } from "./features/pages/PublishPage/feature.js";
import { UnpublishPageFeature } from "./features/pages/UnpublishPage/feature.js";
import { DuplicatePageFeature } from "./features/pages/DuplicatePage/feature.js";
import { TranslatePageFeature } from "./features/pages/TranslatePage/feature.js";
import { MovePageFeature } from "./features/pages/MovePage/feature.js";
// Misc
import { WbPermissionsFeature } from "./features/permissions/feature.js";
import { ApiKeyInstallerFeature } from "./features/installer/feature.js";
import { NextjsFeature } from "./features/nextjs/feature.js";
import { NuxtFeature } from "./features/nuxt/feature.js";
import { WbWebhooksFeature } from "./features/webhooks/feature.js";
import { ExperimentFeature } from "./features/experiments/feature.js";
import { VariantFeature } from "./features/variants/feature.js";
import { NextjsGraphQLSchema } from "./graphql/nextjs/NextjsGraphQLSchema.js";
import { NuxtGraphQLSchema } from "./graphql/nuxt/NuxtGraphQLSchema.js";
// Models
import { PAGE_MODEL_ID, PageModelPlugin } from "~/domain/page/page.model.js";
import { RedirectModelPlugin } from "~/domain/redirect/redirect.model.js";
import {
    ExperimentModelPlugin,
    EXPERIMENT_MODEL_ID
} from "~/domain/experiment/experiment.model.js";
import { VariantModelPlugin, VARIANT_MODEL_ID } from "~/domain/variant/variant.model.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { RedirectModelProvider } from "~/features/redirects/RedirectModelProvider.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import { VariantModel } from "~/domain/variant/abstractions.js";

export const WebsiteBuilderFeature = createFeature({
    name: "WebsiteBuilder",
    register(container: Container) {
        // CMS features needed by the redirect REST route (before the CMS schema builds). When the CMS
        // contextual schema runs for GraphQL requests it overwrites StorageOperations/AccessControl
        // with full-context versions (last-wins).
        CompressionFeature.register(container);
        StorageFeature.register(container);
        ModelBuilderFeature.register(container);
        ContentModelFeature.register(container);
        ContentEntriesFeature.register(container);
        CmsWhereMapperFeature.register(container);
        CmsSortMapperFeature.register(container);

        // WB model factories so ModelsProvider can build CmsModel instances.
        container.register(PageModelPlugin);
        container.register(RedirectModelPlugin);
        container.register(ExperimentModelPlugin);
        container.register(VariantModelPlugin);

        // Permissions.
        WbPermissionsFeature.register(container);

        // Redirect features + REST route.
        GetRedirectByIdFeature.register(container);
        ListRedirectsFeature.register(container);
        GetActiveRedirectsFeature.register(container);
        CreateRedirectFeature.register(container);
        UpdateRedirectFeature.register(container);
        DeleteRedirectFeature.register(container);
        MoveRedirectFeature.register(container);
        InvalidateRedirectsCacheFeature.register(container);
        container.register(WebsiteBuilderRedirectsRoute);

        // Page features.
        GetPageByIdFeature.register(container);
        GetPageByPathFeature.register(container);
        GetPageRevisionsFeature.register(container);
        GetDeletedPageByIdFeature.register(container);
        GetPageLanguagePathsFeature.register(container);
        ListPagesFeature.register(container);
        ListDeletedPagesFeature.register(container);
        CreatePageFeature.register(container);
        CreatePageRevisionFromFeature.register(container);
        DeletePageFeature.register(container);
        TrashPageFeature.register(container);
        RestorePageFeature.register(container);
        UpdatePageFeature.register(container);
        UpdatePageRevisionDescriptionFeature.register(container);
        PublishPageFeature.register(container);
        UnpublishPageFeature.register(container);
        DuplicatePageFeature.register(container);
        TranslatePageFeature.register(container);
        MovePageFeature.register(container);

        // A/B testing — experiments and variants.
        ExperimentFeature.register(container);
        VariantFeature.register(container);

        // Misc features + framework GraphQL (Next.js / Nuxt).
        ApiKeyInstallerFeature.register(container);
        NextjsFeature.register(container);
        NuxtFeature.register(container);
        WbWebhooksFeature.register(container);
        container.register(NextjsGraphQLSchema);
        container.register(NuxtGraphQLSchema);

        // Static WB GraphQL schema (base + pages + redirects + experiments).
        registerWebsiteBuilderGraphQL(container);

        // The per-tenant redirect model is resolved on demand — see RedirectModelProvider. The
        // remaining models are still pushed in by the initializer below, until they are converted
        // too.
        container.register(RedirectModelProvider);

        // Per-request resolution of the WB CmsModel instances (Page/Redirect) for the GraphQL path.
        // The REST route path uses setupWebsiteBuilderModels() (runs for all transports, pre-routing).
        container.registerInstance(RequestContextInitializer, {
            async init(ctx: Record<string, any>) {
                const requestContainer = ctx.container as Container;
                const identityContext = requestContainer.resolve(IdentityContext);
                const getModel = requestContainer.resolve(GetModelUseCase);

                await identityContext.withoutAuthorization(async () => {
                    const [pageModel, experimentModel, variantModel] = await Promise.all([
                        getModel.execute(PAGE_MODEL_ID),
                        getModel.execute(EXPERIMENT_MODEL_ID),
                        getModel.execute(VARIANT_MODEL_ID)
                    ]);

                    requestContainer.registerInstance(PageModel, pageModel.value);
                    requestContainer.registerInstance(ExperimentModel, experimentModel.value);
                    requestContainer.registerInstance(VariantModel, variantModel.value);
                });
            }
        });
    }
});

/**
 * Resolves the WB CmsModel instances (Page/Redirect) from the registered ModelFactory plugins and
 * exposes them by token for the redirect REST route + page features. Must run in the `request`
 * callback after WebsiteBuilderFeature.register() and HeadlessCmsFeature.register().
 *
 * Storage operations, AccessControl, the entry transforms and SearchableFieldsProvider are provided
 * by HeadlessCmsFeature.register() for every event, so WB no longer builds its own.
 */
export async function setupWebsiteBuilderModels(container: Container): Promise<void> {
    const modelsProvider = container.resolve(ModelsProvider);
    const tenantCtx = container.resolve(TenantContext);
    // getTenant() is typed non-null but returns null before the tenant is set during routing;
    // fall back to "root" for code-defined model building (the per-request tenant is applied later
    // when DynamoDB queries run).
    const tenantId = (tenantCtx.getTenant() as any)?.id ?? "root";
    const models = await modelsProvider.list(tenantId);

    const pageModel = models.find(m => m.modelId === PAGE_MODEL_ID);
    const experimentModel = models.find(m => m.modelId === EXPERIMENT_MODEL_ID);
    const variantModel = models.find(m => m.modelId === VARIANT_MODEL_ID);

    if (pageModel) {
        container.registerInstance(PageModel, pageModel);
    }
    if (experimentModel) {
        container.registerInstance(ExperimentModel, experimentModel);
    }
    if (variantModel) {
        container.registerInstance(VariantModel, variantModel);
    }
}

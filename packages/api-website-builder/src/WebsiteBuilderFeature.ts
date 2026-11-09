import { type Container, createFeature } from "@webiny/feature/api";
import { ModelBuilderFeature } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { StorageFeature } from "@webiny/api-headless-cms/features/storage/index.js";
import { ContentModelFeature } from "@webiny/api-headless-cms/features/contentModel/ContentModelFeature.js";
import { ContentEntriesFeature } from "@webiny/api-headless-cms/features/contentEntry/ContentEntriesFeature.js";
import { CmsWhereMapperFeature } from "@webiny/api-headless-cms/features/whereMapper/feature.js";
import { CmsSortMapperFeature } from "@webiny/api-headless-cms/features/sortMapper/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { WebsiteBuilderRedirectsRouteDefinition } from "./rest/WebsiteBuilderRedirectsRoute.js";
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
import { DeletePageRevisionFeature } from "./features/pages/DeletePageRevision/feature.js";
import { TrashPageFeature } from "./features/pages/TrashPage/feature.js";
import { RestorePageFeature } from "./features/pages/RestorePage/feature.js";
import { UpdatePageFeature } from "./features/pages/UpdatePage/feature.js";
import { UpdatePageRevisionDescriptionFeature } from "./features/pages/UpdatePageRevisionDescription/feature.js";
import { PublishPageFeature } from "./features/pages/PublishPage/feature.js";
import { UnpublishPageFeature } from "./features/pages/UnpublishPage/feature.js";
import { DuplicatePageFeature } from "./features/pages/DuplicatePage/feature.js";
import { TranslatePageFeature } from "./features/pages/TranslatePage/feature.js";
import { MovePageFeature } from "./features/pages/MovePage/feature.js";
import { GetSettingsFeature } from "./features/pages/GetSettings/feature.js";
import { ComposePageFeature } from "./features/pages/ComposePage/feature.js";
// Global components
import { GetGlobalComponentFeature } from "./features/globals/GetGlobalComponent/feature.js";
import { ListGlobalComponentsFeature } from "./features/globals/ListGlobalComponents/feature.js";
import { ListAllGlobalComponentsFeature } from "./features/globals/ListAllGlobalComponents/feature.js";
import { ListPageGlobalComponentsFeature } from "./features/globals/ListPageGlobalComponents/feature.js";
import { SaveGlobalComponentFeature } from "./features/globals/SaveGlobalComponent/feature.js";
import { PageGlobalComponentsFeature } from "./features/globals/PageGlobalComponents/feature.js";
import { GlobalsGraphQLSchema } from "./graphql/globals/GlobalsGraphQLSchema.js";
// Layouts
import { GetLayoutFeature } from "./features/layouts/GetLayout/feature.js";
import { ListLayoutsFeature } from "./features/layouts/ListLayouts/feature.js";
import { CreateLayoutFeature } from "./features/layouts/CreateLayout/feature.js";
import { UpdateLayoutFeature } from "./features/layouts/UpdateLayout/feature.js";
import { DeleteLayoutFeature } from "./features/layouts/DeleteLayout/feature.js";
import { GetLayoutRevisionsFeature } from "./features/layouts/GetLayoutRevisions/feature.js";
import { GetPageLayoutFeature } from "./features/layouts/GetPageLayout/feature.js";
import { GetLayoutBySlugFeature } from "./features/layouts/GetLayoutBySlug/feature.js";
import { ComposeLayoutFeature } from "./features/layouts/ComposeLayout/feature.js";
import { GetLayoutSettingsFeature } from "./features/layouts/GetLayoutSettings/feature.js";
import { SetDefaultLayoutFeature } from "./features/layouts/SetDefaultLayout/feature.js";
import { GetLayoutUsageFeature } from "./features/layouts/GetLayoutUsage/feature.js";
import { PublishLayoutFeature } from "./features/layouts/PublishLayout/feature.js";
import { UnpublishLayoutFeature } from "./features/layouts/UnpublishLayout/feature.js";
import { CreateLayoutRevisionFromFeature } from "./features/layouts/CreateLayoutRevisionFrom/feature.js";
import { DeleteLayoutRevisionFeature } from "./features/layouts/DeleteLayoutRevision/feature.js";
import { DuplicateLayoutFeature } from "./features/layouts/DuplicateLayout/feature.js";
import { TranslateLayoutFeature } from "./features/layouts/TranslateLayout/feature.js";
import { PageDefaultLayoutFeature } from "./features/layouts/PageDefaultLayout/feature.js";
import { LayoutSlugsFeature } from "./features/layouts/LayoutSlugs/feature.js";
import { LayoutsGraphQLSchema } from "./graphql/layouts/LayoutsGraphQLSchema.js";
import { PageLayoutDtoMapper } from "./graphql/layouts/PageLayoutDtoMapper.js";
import { EnsureWbPageFolderIsEmptyOnDeleteFeature } from "./features/folders/EnsureWbPageFolderIsEmptyOnDelete/feature.js";
import { EnsureWbRedirectFolderIsEmptyOnDeleteFeature } from "./features/folders/EnsureWbRedirectFolderIsEmptyOnDelete/feature.js";
// Misc
import { WbPermissionsFeature } from "./features/permissions/feature.js";
import { ApiKeyInstallerFeature } from "./features/installer/feature.js";
import { NextjsFeature } from "./features/nextjs/feature.js";
import { NuxtFeature } from "./features/nuxt/feature.js";
import { WbStarterKitsFeature } from "./features/starterKits/feature.js";
import { WbWebhooksFeature } from "./features/webhooks/feature.js";
import { ExperimentFeature } from "./features/experiments/feature.js";
import { VariantFeature } from "./features/variants/feature.js";
// Models
import { PageModelPlugin } from "~/domain/page/page.model.js";
import { RedirectModelPlugin } from "~/domain/redirect/redirect.model.js";
import { ExperimentModelPlugin } from "~/domain/experiment/experiment.model.js";
import { VariantModelPlugin } from "~/domain/variant/variant.model.js";
import { GlobalComponentModelPlugin } from "~/domain/globals/globalComponent.model.js";
import { LayoutModelPlugin } from "~/domain/layout/layout.model.js";
import { RedirectModelProvider } from "~/features/redirects/RedirectModelProvider.js";
import { VariantModelProvider } from "~/features/variants/VariantModelProvider.js";
import { ExperimentModelProvider } from "~/features/experiments/ExperimentModelProvider.js";
import { PageModelProvider } from "~/features/pages/PageModelProvider.js";
import { GlobalComponentModelProvider } from "~/features/globals/GlobalComponentModelProvider.js";
import { LayoutModelProvider } from "~/features/layouts/LayoutModelProvider.js";

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
        container.register(GlobalComponentModelPlugin);
        container.register(LayoutModelPlugin);

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
        container.register(WebsiteBuilderRedirectsRouteDefinition);

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
        DeletePageRevisionFeature.register(container);
        TrashPageFeature.register(container);
        RestorePageFeature.register(container);
        UpdatePageFeature.register(container);
        UpdatePageRevisionDescriptionFeature.register(container);
        PublishPageFeature.register(container);
        UnpublishPageFeature.register(container);
        DuplicatePageFeature.register(container);
        TranslatePageFeature.register(container);
        MovePageFeature.register(container);
        GetSettingsFeature.register(container);
        ComposePageFeature.register(container);

        // Global components: stored apart from pages, one record per component and language.
        GetGlobalComponentFeature.register(container);
        ListGlobalComponentsFeature.register(container);
        ListAllGlobalComponentsFeature.register(container);
        ListPageGlobalComponentsFeature.register(container);
        SaveGlobalComponentFeature.register(container);
        PageGlobalComponentsFeature.register(container);
        container.register(GlobalsGraphQLSchema);

        // Layouts: the documents pages are rendered in.
        GetLayoutFeature.register(container);
        ListLayoutsFeature.register(container);
        CreateLayoutFeature.register(container);
        UpdateLayoutFeature.register(container);
        DeleteLayoutFeature.register(container);
        GetLayoutRevisionsFeature.register(container);
        GetPageLayoutFeature.register(container);
        GetLayoutBySlugFeature.register(container);
        ComposeLayoutFeature.register(container);
        GetLayoutSettingsFeature.register(container);
        SetDefaultLayoutFeature.register(container);
        GetLayoutUsageFeature.register(container);
        PublishLayoutFeature.register(container);
        UnpublishLayoutFeature.register(container);
        CreateLayoutRevisionFromFeature.register(container);
        DeleteLayoutRevisionFeature.register(container);
        DuplicateLayoutFeature.register(container);
        TranslateLayoutFeature.register(container);
        PageDefaultLayoutFeature.register(container);
        LayoutSlugsFeature.register(container);
        container.register(PageLayoutDtoMapper);
        container.register(LayoutsGraphQLSchema);

        // Folders: block deleting a folder that still has pages or redirects in it.
        EnsureWbPageFolderIsEmptyOnDeleteFeature.register(container);
        EnsureWbRedirectFolderIsEmptyOnDeleteFeature.register(container);

        // A/B testing — experiments and variants.
        ExperimentFeature.register(container);
        VariantFeature.register(container);

        // Misc features. The Next.js and Nuxt configs reach the Admin as Frontend Settings starter kits.
        ApiKeyInstallerFeature.register(container);
        NextjsFeature.register(container);
        NuxtFeature.register(container);
        WbStarterKitsFeature.register(container);
        WbWebhooksFeature.register(container);

        // Static WB GraphQL schema (base + pages + redirects + experiments).
        registerWebsiteBuilderGraphQL(container);

        // The per-tenant redirect model is resolved on demand — see RedirectModelProvider. The
        // remaining models are still pushed in by the initializer below, until they are converted
        // too.
        container.register(RedirectModelProvider);
        container.register(VariantModelProvider);
        container.register(ExperimentModelProvider);
        container.register(PageModelProvider);
        container.register(GlobalComponentModelProvider);
        container.register(LayoutModelProvider);
    }
});

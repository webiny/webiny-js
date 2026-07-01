import { createContextPlugin } from "@webiny/api";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createGraphQL } from "./graphql/createGraphQL.js";
import { createRedirectsRoute } from "./rest/getRedirects.js";
import { GetRedirectByIdFeature } from "./features/redirects/GetRedirectById/feature.js";
import { ListRedirectsFeature } from "./features/redirects/ListRedirects/feature.js";
import { GetActiveRedirectsFeature } from "./features/redirects/GetActiveRedirects/feature.js";
import { CreateRedirectFeature } from "./features/redirects/CreateRedirect/feature.js";
import { UpdateRedirectFeature } from "./features/redirects/UpdateRedirect/feature.js";
import { DeleteRedirectFeature } from "./features/redirects/DeleteRedirect/feature.js";
import { MoveRedirectFeature } from "./features/redirects/MoveRedirect/feature.js";
import { InvalidateRedirectsCacheFeature } from "./features/redirects/InvalidateRedirectsCache/feature.js";
import { GetPageByIdFeature } from "./features/pages/GetPageById/feature.js";
import { GetPageByPathFeature } from "./features/pages/GetPageByPath/feature.js";
import { GetPageRevisionsFeature } from "./features/pages/GetPageRevisions/feature.js";
import { ListPagesFeature } from "./features/pages/ListPages/feature.js";
import { CreatePageFeature } from "./features/pages/CreatePage/feature.js";
import { CreatePageRevisionFromFeature } from "./features/pages/CreatePageRevisionFrom/feature.js";
import { DeletePageFeature } from "./features/pages/DeletePage/feature.js";
import { UpdatePageFeature } from "./features/pages/UpdatePage/feature.js";
import { PublishPageFeature } from "./features/pages/PublishPage/feature.js";
import { UnpublishPageFeature } from "./features/pages/UnpublishPage/feature.js";
import { DuplicatePageFeature } from "./features/pages/DuplicatePage/feature.js";
import { TranslatePageFeature } from "./features/pages/TranslatePage/feature.js";
import { MovePageFeature } from "./features/pages/MovePage/feature.js";
import { PageModelPlugin, PAGE_MODEL_ID } from "~/domain/page/page.model.js";
import { RedirectModelPlugin, REDIRECT_MODEL_ID } from "~/domain/redirect/redirect.model.js";
import {
    ExperimentModelPlugin,
    EXPERIMENT_MODEL_ID
} from "~/domain/experiment/experiment.model.js";
import { VariantModelPlugin, VARIANT_MODEL_ID } from "~/domain/variant/variant.model.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { RedirectModel } from "~/domain/redirect/abstractions.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import { VariantModel } from "~/domain/variant/abstractions.js";
import { WbPermissionsFeature } from "~/features/permissions/feature.js";
import { ApiKeyInstallerFeature } from "~/features/installer/feature.js";
import { NextjsGraphQLSchema } from "~/graphql/nextjs/NextjsGraphQLSchema.js";
import { NextjsFeature } from "~/features/nextjs/feature.js";
import { NuxtGraphQLSchema } from "~/graphql/nuxt/NuxtGraphQLSchema.js";
import { NuxtFeature } from "~/features/nuxt/feature.js";
import { ListDeletedPagesFeature } from "~/features/pages/ListDeletedPages/feature.js";
import { TrashPageFeature } from "~/features/pages/TrashPage/feature.js";
import { RestorePageFeature } from "~/features/pages/RestorePage/feature.js";
import { GetDeletedPageByIdFeature } from "~/features/pages/GetDeletedPageById/feature.js";
import { GetPageLanguagePathsFeature } from "~/features/pages/GetPageLanguagePaths/feature.js";
import { UpdatePageRevisionDescriptionFeature } from "./features/pages/UpdatePageRevisionDescription/feature.js";
import { WbWebhooksFeature } from "./features/webhooks/feature.js";
import { CreateExperimentFeature } from "~/features/experiments/CreateExperiment/feature.js";
import { UpdateExperimentFeature } from "~/features/experiments/UpdateExperiment/feature.js";
import { GetExperimentByIdFeature } from "~/features/experiments/GetExperimentById/feature.js";
import { ListExperimentsFeature } from "~/features/experiments/ListExperiments/feature.js";
import { GetActiveExperimentForRevisionFeature } from "~/features/experiments/GetActiveExperimentForRevision/feature.js";
import { StartExperimentFeature } from "~/features/experiments/StartExperiment/feature.js";
import { StopExperimentFeature } from "~/features/experiments/StopExperiment/feature.js";
import { GraduateVariantFeature } from "~/features/experiments/GraduateVariant/feature.js";
import { GetActiveExperimentForPathFeature } from "~/features/experiments/GetActiveExperimentForPath/feature.js";
import { EndExperimentOnPublishFeature } from "~/features/experiments/EndExperimentOnPublish/feature.js";
import { ExperimentPauseFeature } from "~/features/experiments/ExperimentPause/feature.js";
import { CreateVariantFeature } from "~/features/variants/CreateVariant/feature.js";
import { UpdateVariantFeature } from "~/features/variants/UpdateVariant/feature.js";
import { DeleteVariantFeature } from "~/features/variants/DeleteVariant/feature.js";
import { GetVariantByIdFeature } from "~/features/variants/GetVariantById/feature.js";
import { ListVariantsFeature } from "~/features/variants/ListVariants/feature.js";
// import { TenantModelExtensionFeature } from "~/features/tenantManager/feature.js";

const createContext = () => {
    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(PageModelPlugin);
        context.container.register(RedirectModelPlugin);
        context.container.register(ExperimentModelPlugin);
        context.container.register(VariantModelPlugin);
    });

    const contextPlugin = createContextPlugin(
        async context => {
            const container = context.container;

            const identityContext = container.resolve(IdentityContext);
            const getModel = container.resolve(GetModelUseCase);

            await identityContext.withoutAuthorization(async () => {
                const [pageModel, redirectModel, experimentModel, variantModel] = await Promise.all(
                    [
                        getModel.execute(PAGE_MODEL_ID),
                        getModel.execute(REDIRECT_MODEL_ID),
                        getModel.execute(EXPERIMENT_MODEL_ID),
                        getModel.execute(VARIANT_MODEL_ID)
                    ]
                );

                container.registerInstance(PageModel, pageModel.value);
                container.registerInstance(RedirectModel, redirectModel.value);
                container.registerInstance(ExperimentModel, experimentModel.value);
                container.registerInstance(VariantModel, variantModel.value);
            });

            // Register permissions
            WbPermissionsFeature.register(container);

            // Register features
            GetRedirectByIdFeature.register(container);
            ListRedirectsFeature.register(container);
            GetActiveRedirectsFeature.register(container);
            CreateRedirectFeature.register(container);
            UpdateRedirectFeature.register(container);
            DeleteRedirectFeature.register(container);
            MoveRedirectFeature.register(container);
            InvalidateRedirectsCacheFeature.register(container);
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
            ApiKeyInstallerFeature.register(container);
            NextjsFeature.register(container);
            NuxtFeature.register(container);
            WbWebhooksFeature.register(container);

            // A/B testing — experiments and variants.
            CreateExperimentFeature.register(container);
            UpdateExperimentFeature.register(container);
            GetExperimentByIdFeature.register(container);
            ListExperimentsFeature.register(container);
            GetActiveExperimentForRevisionFeature.register(container);
            StartExperimentFeature.register(container);
            StopExperimentFeature.register(container);
            GraduateVariantFeature.register(container);
            GetActiveExperimentForPathFeature.register(container);
            EndExperimentOnPublishFeature.register(container);
            ExperimentPauseFeature.register(container);
            CreateVariantFeature.register(container);
            UpdateVariantFeature.register(container);
            DeleteVariantFeature.register(container);
            GetVariantByIdFeature.register(container);
            ListVariantsFeature.register(container);
            // TenantModelExtensionFeature.register(container);

            // Register GraphQL
            container.register(NextjsGraphQLSchema);
            container.register(NuxtGraphQLSchema);
        },
        { name: "wb.createContext" }
    );

    return [contextPlugin, modelsPlugin];
};

export const createWebsiteBuilder = () => {
    return [...createContext(), createGraphQL(), createRedirectsRoute()];
};

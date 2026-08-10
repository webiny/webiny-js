import { type Container, createFeature } from "@webiny/feature/api";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { registerThemeGraphQL } from "./graphql/createGraphQL.js";
import { THEME_MODEL_ID, ThemeModelPlugin } from "~/domain/theme/theme.model.js";
import { ThemeModel } from "~/domain/theme/abstractions.js";
import { ThemePermissionsFeature } from "~/features/permissions/feature.js";
import { ActiveThemeStoreFeature } from "~/features/ActiveThemeStore/feature.js";
import { CreateThemeFeature } from "~/features/CreateTheme/feature.js";
import { GetThemeByIdFeature } from "~/features/GetThemeById/feature.js";
import { ListThemesFeature } from "~/features/ListThemes/feature.js";
import { UpdateThemeFeature } from "~/features/UpdateTheme/feature.js";
import { DeleteThemeFeature } from "~/features/DeleteTheme/feature.js";
import { GetThemeRevisionsFeature } from "~/features/GetThemeRevisions/feature.js";
import { CreateThemeRevisionFromFeature } from "~/features/CreateThemeRevisionFrom/feature.js";
import { PublishThemeFeature } from "~/features/PublishTheme/feature.js";
import { ActivateThemeFeature } from "~/features/ActivateTheme/feature.js";
import { GetActiveThemeFeature } from "~/features/GetActiveTheme/feature.js";
import { ThemeArtifactsFeature } from "~/features/ThemeArtifacts/feature.js";
import { ThemeWebhooksFeature } from "~/features/webhooks/feature.js";
import { StableThemeRoute } from "~/rest/StableThemeRoute.js";
import { ThemePreviewRoute } from "~/rest/ThemePreviewRoute.js";

export const ThemeFeature = createFeature({
    name: "Theme",
    register(container: Container) {
        // The CMS model factory, so ModelsProvider can build the CmsModel.
        container.register(ThemeModelPlugin);

        ThemePermissionsFeature.register(container);
        ActiveThemeStoreFeature.register(container);

        CreateThemeFeature.register(container);
        GetThemeByIdFeature.register(container);
        ListThemesFeature.register(container);
        UpdateThemeFeature.register(container);
        DeleteThemeFeature.register(container);
        GetThemeRevisionsFeature.register(container);
        CreateThemeRevisionFromFeature.register(container);
        PublishThemeFeature.register(container);
        ActivateThemeFeature.register(container);
        GetActiveThemeFeature.register(container);
        ThemeArtifactsFeature.register(container);
        ThemeWebhooksFeature.register(container);

        // Delivery endpoints. The stable URL serves the active version publicly at a short TTL;
        // preview addresses a specific draft, gated and uncacheable. See C7 and the routes.
        container.register(StableThemeRoute);
        container.register(ThemePreviewRoute);

        registerThemeGraphQL(container);

        // Per-request resolution of the Theme CmsModel. Repositories inject `ThemeModel` as a plain
        // dependency rather than resolving the model themselves. Runs without authorization because
        // reading the model definition is not the same act as reading an entry — entry-level
        // authorization still applies in the use cases.
        container.registerInstance(RequestContextInitializer, {
            async init(ctx: Record<string, any>) {
                const requestContainer = ctx.container as Container;
                const identityContext = requestContainer.resolve(IdentityContext);
                const getModel = requestContainer.resolve(GetModelUseCase);

                await identityContext.withoutAuthorization(async () => {
                    const model = await getModel.execute(THEME_MODEL_ID);
                    requestContainer.registerInstance(ThemeModel, model.value);
                });
            }
        });
    }
});

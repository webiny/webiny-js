import { type Container, createFeature } from "@webiny/feature/api";
import { registerThemeGraphQL } from "./graphql/createGraphQL.js";
import { ThemeModelPlugin } from "~/domain/theme/theme.model.js";
import { ThemeModelProvider } from "~/features/ThemeModelProvider.js";
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
import { StableThemeRouteDefinition } from "~/rest/StableThemeRoute.js";
import { ThemePreviewRouteDefinition } from "~/rest/ThemePreviewRoute.js";

export const ThemeFeature = createFeature({
    name: "Theme",
    register(container: Container) {
        // The CMS model factory, so ModelsProvider can build the CmsModel.
        container.register(ThemeModelPlugin);

        // Resolves that model on demand. Repositories inject the provider and await it, so nothing
        // depends on a per-request hook having deposited the model first.
        container.register(ThemeModelProvider);

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
        container.register(StableThemeRouteDefinition);
        container.register(ThemePreviewRouteDefinition);

        registerThemeGraphQL(container);
    }
});

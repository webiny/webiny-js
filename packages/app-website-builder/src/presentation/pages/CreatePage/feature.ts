import { createFeature } from "@webiny/feature/admin";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { CreatePagePresenter as PresenterAbstraction } from "./abstractions.js";
import { CreatePagePresenter } from "./CreatePagePresenter.js";
import { PageTypeProvider } from "./PageTypeProvider.js";
import { StaticPageType } from "./StaticPageType.js";
import { AddLanguageModifier } from "./AddLanguageModifier.js";

export const CreatePageFeature = createFeature({
    name: "CreatePage",
    register(container) {
        container.register(StaticPageType);
        container.register(PageTypeProvider);
        container.register(CreatePagePresenter);

        // Languages are behind a feature flag
        const featureFlagsService = container.resolve(FeatureFlagsService);
        if (featureFlagsService.getFlags().isEnabled("multiTenancy")) {
            container.register(AddLanguageModifier);
        }
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});

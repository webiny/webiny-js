import { createFeature } from "@webiny/feature/admin";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { CreateLayoutPresenter as PresenterAbstraction } from "./abstractions.js";
import { CreateLayoutPresenterRegistration } from "./CreateLayoutPresenter.js";
import { AddLayoutLanguageModifier } from "./AddLayoutLanguageModifier.js";

export const CreateLayoutDialogFeature = createFeature({
    name: "WebsiteBuilder/CreateLayoutDialog",
    register(container) {
        container.register(CreateLayoutPresenterRegistration);

        // Languages are behind a feature flag.
        const featureFlagsService = container.resolve(FeatureFlagsService);
        if (featureFlagsService.getFlags().isEnabled("multiTenancy")) {
            container.register(AddLayoutLanguageModifier);
        }
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});

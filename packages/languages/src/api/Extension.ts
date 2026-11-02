import { createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import LanguageModel from "./domain/LanguageModel.js";
import { EnsureSingleDefaultLanguageFeature } from "./features/EnsureSingleDefaultLanguage/feature.js";
import { GetDefaultLanguageFeature } from "./features/GetDefaultLanguage/feature.js";
import { GetLanguageByCodeFeature } from "./features/GetLanguageByCode/feature.js";
import { ListLanguagesFeature } from "./features/ListLanguages/feature.js";
import { LanguagesGraphQLSchema } from "./graphql/LanguagesGraphQLSchema.js";
import { AddCmsPermissionsFeature } from "~/api/features/AddCmsPermissions/feature.js";
import { LanguagesPermissionsFeature } from "~/api/features/Permissions/feature.js";

export const Extension = createFeature({
    name: "Languages",
    register(container) {
        /*
         * Register-time gate on the effective feature flags (project config && live WCP license).
         * Nothing is registered when languages are off, so the model and its GraphQL schema do not
         * exist for that project.
         */
        if (!container.resolve(FeatureFlags).get().isEnabled("languages")) {
            return;
        }

        container.register(LanguageModel);

        // Features
        EnsureSingleDefaultLanguageFeature.register(container);
        GetDefaultLanguageFeature.register(container);
        GetLanguageByCodeFeature.register(container);
        ListLanguagesFeature.register(container);
        AddCmsPermissionsFeature.register(container);
        LanguagesPermissionsFeature.register(container);

        // GraphQL
        container.register(LanguagesGraphQLSchema);
    }
});

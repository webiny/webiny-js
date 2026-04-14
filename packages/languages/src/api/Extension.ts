import { createFeature } from "@webiny/feature/api";
import LanguageModel from "./domain/LanguageModel.js";
import { EnsureSingleDefaultLanguageFeature } from "./features/EnsureSingleDefaultLanguage/feature.js";
import { GetLanguageByCodeFeature } from "./features/GetLanguageByCode/feature.js";
import { ListLanguagesFeature } from "./features/ListLanguages/feature.js";
import { LanguagesGraphQLSchema } from "./graphql/LanguagesGraphQLSchema.js";
import { AddCmsPermissionsFeature } from "~/api/features/AddCmsPermissions/feature.js";
import { LanguagesPermissionsFeature } from "~/api/features/Permissions/feature.js";

export const Extension = createFeature({
    name: "Languages",
    register(container) {
        container.register(LanguageModel);

        // Features
        EnsureSingleDefaultLanguageFeature.register(container);
        GetLanguageByCodeFeature.register(container);
        ListLanguagesFeature.register(container);
        AddCmsPermissionsFeature.register(container);
        LanguagesPermissionsFeature.register(container);

        // GraphQL
        container.register(LanguagesGraphQLSchema);
    }
});

import { createFeature } from "@webiny/feature/api";
import LanguageModel from "./domain/LanguageModel.js";
import { EnsureSingleDefaultLanguageFeature } from "./features/ensureSingleDefaultLanguage/feature.js";
import { GetLanguageByCodeFeature } from "./features/getLanguageByCode/feature.js";
import { ListLanguagesFeature } from "./features/listLanguages/feature.js";
import { LanguagesGraphQLSchema } from "./graphql/LanguagesGraphQLSchema.js";

export const Extension = createFeature({
    name: "Languages",
    register(container) {
        container.register(LanguageModel);

        // Features
        EnsureSingleDefaultLanguageFeature.register(container);
        GetLanguageByCodeFeature.register(container);
        ListLanguagesFeature.register(container);
        
        // GraphQL
        container.register(LanguagesGraphQLSchema)
    }
});

import { createFeature } from "@webiny/feature/api";
import LanguageModel from "./domain/LanguageModel.js";
import { EnsureSingleDefaultLanguageFeature } from "./features/ensureSingleDefaultLanguage/feature.js";
import { GetLanguageByCodeFeature } from "./features/getLanguageByCode/feature.js";
import { ListLanguagesFeature } from "./features/listLanguages/feature.js";

export const Extension = createFeature({
    name: "Languages",
    register(container) {
        container.register(LanguageModel);

        EnsureSingleDefaultLanguageFeature.register(container);
        GetLanguageByCodeFeature.register(container);
        ListLanguagesFeature.register(container);
    }
});

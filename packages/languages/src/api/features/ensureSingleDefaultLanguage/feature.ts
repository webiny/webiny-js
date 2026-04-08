import { createFeature } from "@webiny/feature/api";
import UnsetDefaultLanguagesHandler from "./UnsetDefaultLanguagesHandler.js";

export const EnsureSingleDefaultLanguageFeature = createFeature({
    name: "Languages/EnsureSingleDefaultLanguage",
    register(container) {
        container.register(UnsetDefaultLanguagesHandler);
    }
});

import { createFeature } from "@webiny/feature/api";
import LanguageModelAccessGuard from "./LanguageModelAccessGuard.js";

export const LanguageModelAccessGuardFeature = createFeature({
    name: "Languages/LanguageModelAccessGuard",
    register(container) {
        container.register(LanguageModelAccessGuard);
    }
});

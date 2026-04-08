import { createFeature } from "@webiny/feature/api";
import { TranslatePageUseCase } from "./TranslatePageUseCase.js";

export const TranslatePageFeature = createFeature({
    name: "WebsiteBuilder/TranslatePage",
    register(container) {
        container.register(TranslatePageUseCase);
    }
});

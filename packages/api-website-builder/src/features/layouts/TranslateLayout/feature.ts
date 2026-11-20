import { createFeature } from "@webiny/feature/api";
import { TranslateLayoutUseCase } from "./TranslateLayoutUseCase.js";

export const TranslateLayoutFeature = createFeature({
    name: "WebsiteBuilder/TranslateLayout",
    register(container) {
        container.register(TranslateLayoutUseCase);
    }
});

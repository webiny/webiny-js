import { createFeature } from "@webiny/feature/admin";
import { TranslateLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TranslateLayoutUseCase } from "./TranslateLayoutUseCase.js";

export const TranslateLayoutFeature = createFeature({
    name: "WebsiteBuilder/TranslateLayout",
    register(container) {
        container.register(TranslateLayoutUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

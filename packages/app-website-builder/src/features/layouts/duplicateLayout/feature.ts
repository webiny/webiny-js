import { createFeature } from "@webiny/feature/admin";
import { DuplicateLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DuplicateLayoutUseCase } from "./DuplicateLayoutUseCase.js";

export const DuplicateLayoutFeature = createFeature({
    name: "WebsiteBuilder/DuplicateLayout",
    register(container) {
        container.register(DuplicateLayoutUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

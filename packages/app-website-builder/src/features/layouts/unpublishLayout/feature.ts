import { createFeature } from "@webiny/feature/admin";
import { UnpublishLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UnpublishLayoutUseCase } from "./UnpublishLayoutUseCase.js";

export const UnpublishLayoutFeature = createFeature({
    name: "WebsiteBuilder/UnpublishLayout",
    register(container) {
        container.register(UnpublishLayoutUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

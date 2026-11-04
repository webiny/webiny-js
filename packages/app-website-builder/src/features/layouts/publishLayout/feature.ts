import { createFeature } from "@webiny/feature/admin";
import { PublishLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { PublishLayoutUseCase } from "./PublishLayoutUseCase.js";

export const PublishLayoutFeature = createFeature({
    name: "WebsiteBuilder/PublishLayout",
    register(container) {
        container.register(PublishLayoutUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

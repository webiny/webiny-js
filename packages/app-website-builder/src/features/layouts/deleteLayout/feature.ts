import { createFeature } from "@webiny/feature/admin";
import { DeleteLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteLayoutUseCase } from "./DeleteLayoutUseCase.js";

export const DeleteLayoutFeature = createFeature({
    name: "WebsiteBuilder/DeleteLayout",
    register(container) {
        container.register(DeleteLayoutUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

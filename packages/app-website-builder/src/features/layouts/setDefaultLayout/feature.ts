import { createFeature } from "@webiny/feature/admin";
import { SetDefaultLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { SetDefaultLayoutUseCase } from "./SetDefaultLayoutUseCase.js";

export const SetDefaultLayoutFeature = createFeature({
    name: "WebsiteBuilder/SetDefaultLayout",
    register(container) {
        container.register(SetDefaultLayoutUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

import { createFeature } from "@webiny/feature/admin";
import { UpdateLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateLayoutUseCase } from "./UpdateLayoutUseCase.js";

export const UpdateLayoutFeature = createFeature({
    name: "WebsiteBuilder/UpdateLayout",
    register(container) {
        container.register(UpdateLayoutUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

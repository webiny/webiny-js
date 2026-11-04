import { createFeature } from "@webiny/feature/admin";
import { CreateLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateLayoutUseCase } from "./CreateLayoutUseCase.js";

export const CreateLayoutFeature = createFeature({
    name: "WebsiteBuilder/CreateLayout",
    register(container) {
        container.register(CreateLayoutUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

import { createFeature } from "@webiny/feature/admin";
import { ListStepTypesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListStepTypesUseCase } from "./ListStepTypesUseCase.js";

export const ListStepTypesFeature = createFeature({
    name: "Workflows/ListStepTypes",
    register(container) {
        container.register(ListStepTypesUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

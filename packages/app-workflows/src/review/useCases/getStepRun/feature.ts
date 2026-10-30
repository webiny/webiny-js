import { createFeature } from "@webiny/feature/admin";
import { GetStepRunUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetStepRunUseCase } from "./GetStepRunUseCase.js";

export const GetStepRunFeature = createFeature({
    name: "Workflows/GetStepRun",
    register(container) {
        container.register(GetStepRunUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

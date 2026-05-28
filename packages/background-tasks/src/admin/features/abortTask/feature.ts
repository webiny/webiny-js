import { createFeature } from "@webiny/feature/admin";
import { AbortTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AbortTaskUseCase } from "./AbortTaskUseCase.js";
import { AbortTaskGateway } from "./AbortTaskGateway.js";

export const AbortTaskFeature = createFeature({
    name: "BackgroundTasks/AbortTask",
    register(container) {
        container.register(AbortTaskUseCase);
        container.register(AbortTaskGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

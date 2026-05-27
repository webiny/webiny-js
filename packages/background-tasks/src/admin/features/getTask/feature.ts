import { createFeature } from "@webiny/feature/admin";
import { GetTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetTaskUseCase } from "./GetTaskUseCase.js";
import { GetTaskGateway } from "./GetTaskGateway.js";

export const GetTaskFeature = createFeature({
    name: "BackgroundTasks/GetTask",
    register(container) {
        container.register(GetTaskUseCase);
        container.register(GetTaskGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

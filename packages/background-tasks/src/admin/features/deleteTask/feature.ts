import { createFeature } from "@webiny/feature/admin";
import { DeleteTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteTaskUseCase } from "./DeleteTaskUseCase.js";
import { DeleteTaskGateway } from "./DeleteTaskGateway.js";

export const DeleteTaskFeature = createFeature({
    name: "BackgroundTasks/DeleteTask",
    register(container) {
        container.register(DeleteTaskUseCase);
        container.register(DeleteTaskGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

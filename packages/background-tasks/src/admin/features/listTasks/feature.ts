import { createFeature } from "@webiny/feature/admin";
import { ListTasksUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListTasksUseCase } from "./ListTasksUseCase.js";
import { ListTasksGateway } from "./ListTasksGateway.js";

export const ListTasksFeature = createFeature({
    name: "BackgroundTasks/ListTasks",
    register(container) {
        container.register(ListTasksUseCase);
        container.register(ListTasksGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

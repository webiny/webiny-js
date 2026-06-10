import { createFeature } from "@webiny/feature/admin";
import { ListLogsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListLogsUseCase } from "./ListLogsUseCase.js";
import { ListLogsGateway } from "./ListLogsGateway.js";

export const ListLogsFeature = createFeature({
    name: "BackgroundTasks/ListLogs",
    register(container) {
        container.register(ListLogsUseCase);
        container.register(ListLogsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

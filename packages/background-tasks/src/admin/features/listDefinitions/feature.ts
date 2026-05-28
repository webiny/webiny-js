import { createFeature } from "@webiny/feature/admin";
import { ListDefinitionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListDefinitionsUseCase } from "./ListDefinitionsUseCase.js";
import { ListDefinitionsGateway } from "./ListDefinitionsGateway.js";

export const ListDefinitionsFeature = createFeature({
    name: "BackgroundTasks/ListDefinitions",
    register(container) {
        container.register(ListDefinitionsUseCase);
        container.register(ListDefinitionsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

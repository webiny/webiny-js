import { createFeature } from "@webiny/feature/admin";
import { ListGlobalComponentsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListGlobalComponentsUseCase } from "./ListGlobalComponentsUseCase.js";
import { ListGlobalComponentsGateway } from "./ListGlobalComponentsGateway.js";

export const ListGlobalComponentsFeature = createFeature({
    name: "WebsiteBuilder/ListGlobalComponents",
    register(container) {
        container.register(ListGlobalComponentsUseCase);
        container.register(ListGlobalComponentsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

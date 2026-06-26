import { createFeature } from "@webiny/feature/admin";
import { ListCustomIconsUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { ListCustomIconsUseCase } from "./ListCustomIconsUseCase.js";
import { ListCustomIconsGateway } from "./ListCustomIconsGateway.js";

export const ListCustomIconsFeature = createFeature({
    name: "Admin/ListCustomIcons",
    register(container) {
        container.register(ListCustomIconsUseCase);
        container.register(ListCustomIconsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

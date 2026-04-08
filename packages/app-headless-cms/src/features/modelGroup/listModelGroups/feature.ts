import { createFeature } from "@webiny/feature/admin";
import { ListModelGroupsUseCase as UseCase } from "./abstractions.js";
import { ListModelGroupsUseCase } from "./ListModelGroupsUseCase.js";
import { ListModelGroupsRepository } from "./ListModelGroupsRepository.js";
import { ListModelGroupsGateway } from "./ListModelGroupsGateway.js";

export const ListModelGroupsFeature = createFeature({
    name: "ListModelGroups",
    register(container) {
        container.register(ListModelGroupsUseCase);
        container.register(ListModelGroupsRepository).inSingletonScope();
        container.register(ListModelGroupsGateway);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});

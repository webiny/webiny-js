import { createFeature } from "@webiny/feature/admin";
import { CreateRoleUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateRoleUseCase } from "./CreateRoleUseCase.js";
import { CreateRoleRepository } from "./CreateRoleRepository.js";
import { CreateRoleGateway } from "./CreateRoleGateway.js";

export const CreateRoleFeature = createFeature({
    name: "AccessManagement/CreateRole",
    register(container) {
        container.register(CreateRoleUseCase);
        container.register(CreateRoleRepository).inSingletonScope();
        container.register(CreateRoleGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

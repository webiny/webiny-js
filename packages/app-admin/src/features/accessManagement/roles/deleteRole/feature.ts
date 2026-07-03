import { createFeature } from "@webiny/feature/admin";
import { DeleteRoleUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteRoleUseCase } from "./DeleteRoleUseCase.js";
import { DeleteRoleRepository } from "./DeleteRoleRepository.js";
import { DeleteRoleGateway } from "./DeleteRoleGateway.js";

export const DeleteRoleFeature = createFeature({
    name: "AccessManagement/DeleteRole",
    register(container) {
        container.register(DeleteRoleUseCase);
        container.register(DeleteRoleRepository).inSingletonScope();
        container.register(DeleteRoleGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

import { createFeature } from "@webiny/feature/admin";
import { UpdateRoleUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateRoleUseCase } from "./UpdateRoleUseCase.js";
import { UpdateRoleRepository } from "./UpdateRoleRepository.js";
import { UpdateRoleGateway } from "./UpdateRoleGateway.js";

export const UpdateRoleFeature = createFeature({
    name: "AccessManagement/UpdateRole",
    register(container) {
        container.register(UpdateRoleUseCase);
        container.register(UpdateRoleRepository).inSingletonScope();
        container.register(UpdateRoleGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

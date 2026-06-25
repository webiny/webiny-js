import { createFeature } from "@webiny/feature/admin";
import { GetRoleUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetRoleUseCase } from "./GetRoleUseCase.js";
import { GetRoleRepository } from "./GetRoleRepository.js";
import { GetRoleGateway } from "./GetRoleGateway.js";

export const GetRoleFeature = createFeature({
    name: "AccessManagement/GetRole",
    register(container) {
        container.register(GetRoleUseCase);
        container.register(GetRoleRepository).inSingletonScope();
        container.register(GetRoleGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

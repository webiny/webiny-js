import { createFeature } from "@webiny/feature/admin";
import { UpdateTeamUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateTeamUseCase } from "./UpdateTeamUseCase.js";
import { UpdateTeamRepository } from "./UpdateTeamRepository.js";
import { UpdateTeamGateway } from "./UpdateTeamGateway.js";

export const UpdateTeamFeature = createFeature({
    name: "AccessManagement/UpdateTeam",
    register(container) {
        container.register(UpdateTeamUseCase);
        container.register(UpdateTeamRepository).inSingletonScope();
        container.register(UpdateTeamGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

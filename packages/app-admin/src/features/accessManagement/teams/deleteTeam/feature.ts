import { createFeature } from "@webiny/feature/admin";
import { DeleteTeamUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteTeamUseCase } from "./DeleteTeamUseCase.js";
import { DeleteTeamRepository } from "./DeleteTeamRepository.js";
import { DeleteTeamGateway } from "./DeleteTeamGateway.js";

export const DeleteTeamFeature = createFeature({
    name: "AccessManagement/DeleteTeam",
    register(container) {
        container.register(DeleteTeamUseCase);
        container.register(DeleteTeamRepository).inSingletonScope();
        container.register(DeleteTeamGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

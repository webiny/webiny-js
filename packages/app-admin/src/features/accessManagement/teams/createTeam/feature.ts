import { createFeature } from "@webiny/feature/admin";
import { CreateTeamUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateTeamUseCase } from "./CreateTeamUseCase.js";
import { CreateTeamRepository } from "./CreateTeamRepository.js";
import { CreateTeamGateway } from "./CreateTeamGateway.js";

export const CreateTeamFeature = createFeature({
    name: "AccessManagement/CreateTeam",
    register(container) {
        container.register(CreateTeamUseCase);
        container.register(CreateTeamRepository).inSingletonScope();
        container.register(CreateTeamGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

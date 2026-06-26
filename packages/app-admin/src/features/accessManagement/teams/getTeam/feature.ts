import { createFeature } from "@webiny/feature/admin";
import { GetTeamUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetTeamUseCase } from "./GetTeamUseCase.js";
import { GetTeamRepository } from "./GetTeamRepository.js";
import { GetTeamGateway } from "./GetTeamGateway.js";

export const GetTeamFeature = createFeature({
    name: "AccessManagement/GetTeam",
    register(container) {
        container.register(GetTeamUseCase);
        container.register(GetTeamRepository).inSingletonScope();
        container.register(GetTeamGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

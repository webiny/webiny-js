import { createFeature } from "@webiny/feature/admin";
import { ListCache } from "~/features/listCache/index.js";
import type { Team } from "../../types.js";
import { ListTeamsUseCase as UseCaseAbstraction, TeamsListCache } from "./abstractions.js";
import { ListTeamsUseCase } from "./ListTeamsUseCase.js";
import { ListTeamsRepository } from "./ListTeamsRepository.js";
import { ListTeamsGateway } from "./ListTeamsGateway.js";

export const ListTeamsFeature = createFeature({
    name: "AccessManagement/ListTeams",
    register(container) {
        container.registerInstance(TeamsListCache, new ListCache<Team>());
        container.register(ListTeamsUseCase);
        container.register(ListTeamsRepository).inSingletonScope();
        container.register(ListTeamsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});

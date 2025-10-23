import type { Container } from "@webiny/di-container";
import { TeamsRepository } from "./shared/TeamsRepository.js";
import { CreateTeamUseCaseImpl } from "./CreateTeam/index.js";
import { GetTeamUseCaseImpl } from "./GetTeam/index.js";
import { ListTeamsUseCaseImpl } from "./ListTeams/index.js";
import { UpdateTeamUseCaseImpl } from "./UpdateTeam/index.js";
import { DeleteTeamUseCaseImpl } from "./DeleteTeam/index.js";

export const TeamsFeature = {
    register(container: Container) {
        // Register repository (singleton)
        container.register(TeamsRepository).inSingletonScope();

        // Register use cases (transient)
        container.register(CreateTeamUseCaseImpl);
        container.register(GetTeamUseCaseImpl);
        container.register(ListTeamsUseCaseImpl);
        container.register(UpdateTeamUseCaseImpl);
        container.register(DeleteTeamUseCaseImpl);
    }
};

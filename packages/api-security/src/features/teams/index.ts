import { createFeature } from "@webiny/feature/api";
import { TeamsRepository } from "./shared/TeamsRepository.js";
import { GetTeamFeature } from "./GetTeam/feature.js";
import { ListTeamsFeature } from "./ListTeams/feature.js";
import { CreateTeamFeature } from "./CreateTeam/feature.js";
import { UpdateTeamFeature } from "./UpdateTeam/feature.js";
import { DeleteTeamFeature } from "./DeleteTeam/feature.js";

export const TeamsFeature = createFeature({
    name: "Teams",
    register(container) {
        // Register repository in singleton scope
        container.register(TeamsRepository).inSingletonScope();

        // Register all use cases
        GetTeamFeature.register(container);
        ListTeamsFeature.register(container);
        CreateTeamFeature.register(container);
        UpdateTeamFeature.register(container);
        DeleteTeamFeature.register(container);
    }
});

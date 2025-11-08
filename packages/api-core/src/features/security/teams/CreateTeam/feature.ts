import { createFeature } from "@webiny/feature/api";
import { CreateTeamUseCaseImpl } from "./CreateTeamUseCase.js";

export const CreateTeamFeature = createFeature({
    name: "CreateTeam",
    register(container) {
        container.register(CreateTeamUseCaseImpl);
    }
});

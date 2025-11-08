import { createFeature } from "@webiny/feature/api";
import { UpdateTeamUseCaseImpl } from "./UpdateTeamUseCase.js";

export const UpdateTeamFeature = createFeature({
    name: "UpdateTeam",
    register(container) {
        container.register(UpdateTeamUseCaseImpl);
    }
});

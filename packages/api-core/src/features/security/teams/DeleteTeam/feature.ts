import { createFeature } from "@webiny/feature/api";
import { DeleteTeamUseCaseImpl } from "./DeleteTeamUseCase.js";

export const DeleteTeamFeature = createFeature({
    name: "DeleteTeam",
    register(container) {
        container.register(DeleteTeamUseCaseImpl);
    }
});

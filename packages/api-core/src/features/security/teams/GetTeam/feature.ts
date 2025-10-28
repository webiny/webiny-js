import { createFeature } from "@webiny/feature/api";
import { GetTeamUseCaseImpl } from "./GetTeamUseCase.js";

export const GetTeamFeature = createFeature({
    name: "GetTeam",
    register(container) {
        container.register(GetTeamUseCaseImpl);
    }
});

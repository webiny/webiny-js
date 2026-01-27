import { createFeature } from "@webiny/feature/api";
import { GetTeamUseCase } from "./GetTeamUseCase.js";

export const GetTeamFeature = createFeature({
    name: "GetTeam",
    register(container) {
        container.register(GetTeamUseCase);
    }
});

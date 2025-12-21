import { createFeature } from "@webiny/feature/api";
import { GetUserTeamsUseCase } from "./GetUserTeamsUseCase.js";

export const GetUserTeamsFeature = createFeature({
    name: "workflows.internal.getUserTeams",
    register(container) {
        container.register(GetUserTeamsUseCase).inSingletonScope();
    }
});

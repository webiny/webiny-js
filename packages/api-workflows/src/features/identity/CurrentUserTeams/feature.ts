import { createFeature } from "@webiny/feature/api";
import { CurrentUserTeams } from "./CurrentUserTeams.js";

export const CurrentUserTeamsFeature = createFeature({
    name: "Workflows/CurrentUserTeams",
    register(container) {
        container.register(CurrentUserTeams).inSingletonScope();
    }
});

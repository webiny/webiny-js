import { createFeature } from "@webiny/feature/api";
import { ListUserTeamsUseCase } from "./ListUserTeamsUseCase.js";

export const ListUserTeamsFeature = createFeature({
    name: "ListUserTeams",
    register(container) {
        container.register(ListUserTeamsUseCase);
    }
});

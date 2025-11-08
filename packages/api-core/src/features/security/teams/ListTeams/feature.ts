import { createFeature } from "@webiny/feature/api";
import { ListTeamsUseCaseImpl } from "./ListTeamsUseCase.js";

export const ListTeamsFeature = createFeature({
    name: "ListTeams",
    register(container) {
        container.register(ListTeamsUseCaseImpl);
    }
});

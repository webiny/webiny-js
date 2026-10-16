import { createFeature } from "@webiny/feature/api";
import { ListReviewCandidateTeamsUseCase } from "./ListReviewCandidateTeamsUseCase.js";

export const ListReviewCandidateTeamsFeature = createFeature({
    name: "Workflows/ListReviewCandidateTeams",
    register(container) {
        container.register(ListReviewCandidateTeamsUseCase);
    }
});

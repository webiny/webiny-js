import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface ReviewCandidateTeam {
    id: string;
    name: string;
}

export interface ListReviewCandidateTeamsInput {
    // The `candidateTeamIds` of one review step.
    teamIds: string[];
}

export interface IListReviewCandidateTeamsUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError =
    IListReviewCandidateTeamsUseCaseErrors[keyof IListReviewCandidateTeamsUseCaseErrors];

export interface IListReviewCandidateTeamsUseCase {
    execute(
        input: ListReviewCandidateTeamsInput
    ): Promise<Result<ReviewCandidateTeam[], UseCaseError>>;
}

/*
 * The names of a step's candidate teams (R208). Internal (D132): no permission check of its own,
 * the field resolver of `WorkflowsReviewStep.candidateTeams` runs after the wrappers authorized
 * the read. Only the team lookup runs without authorization, because `GetTeamUseCase` needs
 * `security.team`; the result carries `id` and `name` and nothing else. An unknown team is left
 * out.
 */
export const ListReviewCandidateTeamsUseCase = createAbstraction<IListReviewCandidateTeamsUseCase>(
    "ListReviewCandidateTeamsUseCase"
);

export namespace ListReviewCandidateTeamsUseCase {
    export type Interface = IListReviewCandidateTeamsUseCase;
    export type Input = ListReviewCandidateTeamsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewCandidateTeam[], UseCaseError>>;
}

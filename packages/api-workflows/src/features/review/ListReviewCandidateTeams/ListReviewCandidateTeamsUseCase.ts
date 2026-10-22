import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import type { Team } from "@webiny/api-core/types/security.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { ReviewTeamLoader } from "~/features/identity/ReviewTeamLoader/index.js";
import { ListReviewCandidateTeamsUseCase as UseCase } from "./abstractions.js";
import type { ReviewCandidateTeam } from "./abstractions.js";

class ListReviewCandidateTeamsUseCaseImpl implements UseCase.Interface {
    constructor(
        private teamLoader: ReviewTeamLoader.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const teamIds = [...new Set(input.teamIds)];
        if (teamIds.length === 0) {
            return Result.ok([]);
        }

        // One loader call; the loader batches the calls of every step resolved in the same tick
        // into one team list for the request (Q79).
        let loaded: Result<Team[], ReviewTeamLoader.Error>;
        try {
            loaded = await this.teamLoader.load(teamIds);
        } catch (error) {
            const message = String(error);
            const cause = error instanceof Error ? error : new Error(message);
            this.logger.error(
                { err: cause, teamIds },
                "Could not look up the candidate teams of a review."
            );
            return Result.fail(new ReviewPersistenceError(cause));
        }
        if (loaded.isFail()) {
            this.logger.error(
                {
                    err: hasErrorSource(loaded.error) ? loaded.error.source : loaded.error,
                    teamIds
                },
                "Could not look up the candidate teams of a review."
            );
            return Result.fail(new ReviewPersistenceError(loaded.error));
        }

        // A deleted team is left out; the step still keeps its id in `candidateTeamIds`.
        const teams: ReviewCandidateTeam[] = loaded.value.map(team => {
            return { id: team.id, name: team.name };
        });
        return Result.ok(teams);
    }
}

export const ListReviewCandidateTeamsUseCase = UseCase.createImplementation({
    implementation: ListReviewCandidateTeamsUseCaseImpl,
    dependencies: [ReviewTeamLoader, Logger]
});

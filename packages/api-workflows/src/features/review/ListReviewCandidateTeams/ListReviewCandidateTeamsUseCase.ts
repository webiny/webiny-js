import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetTeamUseCase } from "@webiny/api-core/features/security/teams/GetTeam/index.js";
import { TeamNotFoundError } from "@webiny/api-core/features/security/teams/shared/errors.js";
import type { Team } from "@webiny/api-core/types/security.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { ListReviewCandidateTeamsUseCase as UseCase } from "./abstractions.js";
import type { ReviewCandidateTeam } from "./abstractions.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";

interface TeamLookup {
    teamId: string;
    result: Result<Team, GetTeamUseCase.Error>;
}

class ListReviewCandidateTeamsUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getTeam: GetTeamUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const teamIds = [...new Set(input.teamIds)];
        if (teamIds.length === 0) {
            return Result.ok([]);
        }

        // `GetTeamUseCase` needs `security.team`, which a reviewer does not have. A name lookup is
        // not an access decision, so only these lookups run without authorization (R208).
        let lookups: TeamLookup[];
        try {
            lookups = await this.identityContext.withoutAuthorization(async () => {
                const found: TeamLookup[] = [];
                for (const teamId of teamIds) {
                    found.push({ teamId, result: await this.getTeam.execute({ id: teamId }) });
                }
                return found;
            });
        } catch (error) {
            const message = String(error);
            const cause = error instanceof Error ? error : new Error(message);
            this.logger.error(
                { err: cause, teamIds },
                "Could not look up the candidate teams of a review."
            );
            return Result.fail(new ReviewPersistenceError(cause));
        }

        const teams: ReviewCandidateTeam[] = [];
        for (const lookup of lookups) {
            if (lookup.result.isOk()) {
                const { id, name } = lookup.result.value;
                teams.push({ id, name });
                continue;
            }
            // A deleted team is left out; the step still keeps its id in `candidateTeamIds`.
            if (lookup.result.error instanceof TeamNotFoundError) {
                continue;
            }
            this.logger.error(
                {
                    err: hasErrorSource(lookup.result.error)
                        ? lookup.result.error.source
                        : lookup.result.error,
                    teamId: lookup.teamId
                },
                "Could not look up the candidate teams of a review."
            );
            return Result.fail(new ReviewPersistenceError(lookup.result.error));
        }
        return Result.ok(teams);
    }
}

export const ListReviewCandidateTeamsUseCase = UseCase.createImplementation({
    implementation: ListReviewCandidateTeamsUseCaseImpl,
    dependencies: [IdentityContext, GetTeamUseCase, Logger]
});

import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import type { Team } from "@webiny/api-core/types/security.js";

export interface IReviewTeamLoader {
    /**
     * The teams with these ids, in the order of `ids`; an unknown id is left out. Ids asked for in
     * the same tick, by any caller of the request, are read with one `ListTeamsUseCase` call
     * (`id_in`), and found teams are kept for the rest of the request. Read without authorization:
     * a team lookup for names and slugs, not an access decision (R208).
     */
    load(ids: string[]): Promise<Result<Team[], ListTeamsUseCase.Error>>;
}

/**
 * A request-scoped team loader, so GraphQL field resolvers (`WorkflowsReviewStep.candidateTeams`)
 * and per-user checks do not read teams one by one (Q79).
 */
export const ReviewTeamLoader = createAbstraction<IReviewTeamLoader>("ReviewTeamLoader");

export namespace ReviewTeamLoader {
    export type Interface = IReviewTeamLoader;
    export type Error = ListTeamsUseCase.Error;
}

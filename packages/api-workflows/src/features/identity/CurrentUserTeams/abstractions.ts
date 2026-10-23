import { createAbstraction } from "@webiny/feature/api";

export interface ICurrentUserTeams {
    /**
     * Team ids of the current identity; `[]` for an anonymous identity or when the lookup fails
     * (no teams means no review rights, R36).
     */
    getTeamIds(): Promise<string[]>;
}

/**
 * The current user's teams, for `actorTeamIds` and viewer flags. A building block for the app
 * wrappers (D132); the api-workflows use cases take team ids as input instead.
 */
export const CurrentUserTeams = createAbstraction<ICurrentUserTeams>("CurrentUserTeams");

export namespace CurrentUserTeams {
    export type Interface = ICurrentUserTeams;
}

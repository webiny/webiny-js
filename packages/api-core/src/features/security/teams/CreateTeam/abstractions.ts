import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Team, CreateTeamInput } from "../shared/types.js";
import { TeamsRepository } from "../shared/abstractions.js";
import { NotAuthorizedError, TeamExistsError, TeamValidationError } from "../shared/errors.js";

export interface ICreateTeamErrors {
    notAuthorized: NotAuthorizedError;
    teamExists: TeamExistsError;
    validation: TeamValidationError;
}

type CreateTeamError = ICreateTeamErrors[keyof ICreateTeamErrors] | TeamsRepository.Error;

export interface ICreateTeam {
    execute(input: CreateTeamInput): Promise<Result<Team, CreateTeamError>>;
}

/** Create a new team. */
export const CreateTeam = createAbstraction<ICreateTeam>("CreateTeam");

export namespace CreateTeam {
    export type Interface = ICreateTeam;
    export type Error = CreateTeamError;
}

export interface TeamBeforeCreatePayload {
    team: Team;
    input: CreateTeamInput;
}

export interface TeamAfterCreatePayload {
    team: Team;
    input: CreateTeamInput;
}

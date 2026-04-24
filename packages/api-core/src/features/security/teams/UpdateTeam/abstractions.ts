import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Team, UpdateTeamInput } from "../shared/types.js";
import { TeamsRepository } from "../shared/abstractions.js";
import {
    NotAuthorizedError,
    CannotUpdatePluginTeamsError,
    CannotUpdateSystemTeamsError,
    TeamValidationError
} from "../shared/errors.js";

export interface IUpdateTeamErrors {
    notAuthorized: NotAuthorizedError;
    cannotUpdatePlugin: CannotUpdatePluginTeamsError;
    cannotUpdateSystem: CannotUpdateSystemTeamsError;
    validation: TeamValidationError;
}

type UpdateTeamError = IUpdateTeamErrors[keyof IUpdateTeamErrors] | TeamsRepository.Error;

export interface IUpdateTeam {
    execute(id: string, input: UpdateTeamInput): Promise<Result<Team, UpdateTeamError>>;
}

/** Update an existing team. */
export const UpdateTeam = createAbstraction<IUpdateTeam>("UpdateTeam");

export namespace UpdateTeam {
    export type Interface = IUpdateTeam;
    export type Error = UpdateTeamError;
}

export interface TeamBeforeUpdatePayload {
    original: Team;
    updated: Team;
    input: UpdateTeamInput;
}

export interface TeamAfterUpdatePayload {
    original: Team;
    updated: Team;
    input: UpdateTeamInput;
}

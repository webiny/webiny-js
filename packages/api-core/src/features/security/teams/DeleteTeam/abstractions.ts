import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Team } from "../shared/types.js";
import { TeamsRepository } from "../shared/abstractions.js";
import {
    NotAuthorizedError,
    CannotDeletePluginTeamsError,
    CannotDeleteSystemTeamsError
} from "../shared/errors.js";

export interface IDeleteTeamErrors {
    notAuthorized: NotAuthorizedError;
    cannotDeletePlugin: CannotDeletePluginTeamsError;
    cannotDeleteSystem: CannotDeleteSystemTeamsError;
}

type DeleteTeamError = IDeleteTeamErrors[keyof IDeleteTeamErrors] | TeamsRepository.Error;

export interface IDeleteTeam {
    execute(id: string): Promise<Result<void, DeleteTeamError>>;
}

export const DeleteTeam = createAbstraction<IDeleteTeam>("DeleteTeam");

export namespace DeleteTeam {
    export type Interface = IDeleteTeam;
    export type Error = DeleteTeamError;
}

export interface TeamBeforeDeletePayload {
    team: Team;
}

export interface TeamAfterDeletePayload {
    team: Team;
}

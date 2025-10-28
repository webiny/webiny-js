import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Team, GetTeamInput } from "../shared/types.js";
import { TeamsRepository } from "../shared/abstractions.js";
import { NotAuthorizedError } from "../shared/errors.js";

export interface IGetTeamErrors {
    notAuthorized: NotAuthorizedError;
}

type GetTeamError = IGetTeamErrors[keyof IGetTeamErrors] | TeamsRepository.Error;

export interface IGetTeam {
    execute(params: GetTeamInput): Promise<Result<Team, GetTeamError>>;
}

export const GetTeam = createAbstraction<IGetTeam>("GetTeam");

export namespace GetTeam {
    export type Interface = IGetTeam;
    export type Error = GetTeamError;
}

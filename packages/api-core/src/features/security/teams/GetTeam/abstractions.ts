import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Team, GetTeamInput } from "../shared/types.js";
import { TeamsRepository } from "../shared/abstractions.js";
import { NotAuthorizedError } from "../shared/errors.js";

export interface IGetTeamUseCaseErrors {
    notAuthorized: NotAuthorizedError;
}

type GetTeamError = IGetTeamUseCaseErrors[keyof IGetTeamUseCaseErrors] | TeamsRepository.Error;

export interface IGetTeamUseCase {
    execute(params: GetTeamInput): Promise<Result<Team, GetTeamError>>;
}

export const GetTeamUseCase = createAbstraction<IGetTeamUseCase>("GetTeamUseCase");

export namespace GetTeamUseCase {
    export type Interface = IGetTeamUseCase;
    export type Error = GetTeamError;
}

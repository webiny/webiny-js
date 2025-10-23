import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Team, ListTeamsInput } from "../shared/types.js";
import { TeamsRepository } from "../shared/abstractions.js";
import { NotAuthorizedError } from "../shared/errors.js";

export interface IListTeamsErrors {
    notAuthorized: NotAuthorizedError;
}

type ListTeamsError = IListTeamsErrors[keyof IListTeamsErrors] | TeamsRepository.Error;

export interface IListTeams {
    execute(params?: ListTeamsInput): Promise<Result<Team[], ListTeamsError>>;
}

export const ListTeams = createAbstraction<IListTeams>("ListTeams");

export namespace ListTeams {
    export type Interface = IListTeams;
    export type Error = ListTeamsError;
}

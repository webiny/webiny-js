import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Team, GetTeamInput, ListTeamsInput } from "./types.js";
import { TeamNotFoundError, TeamStorageError } from "./errors.js";

export interface ITeamsRepositoryErrors {
    base: TeamNotFoundError | TeamStorageError;
}

type RepositoryError = ITeamsRepositoryErrors[keyof ITeamsRepositoryErrors];

export interface ITeamsRepository {
    get(params: GetTeamInput): Promise<Result<Team, RepositoryError>>;
    list(params: ListTeamsInput): Promise<Result<Team[], RepositoryError>>;
    create(data: Team): Promise<Result<void, RepositoryError>>;
    update(data: Team): Promise<Result<void, RepositoryError>>;
    delete(team: Team): Promise<Result<void, RepositoryError>>;
}

export const TeamsRepository = createAbstraction<ITeamsRepository>("TeamsRepository");

export namespace TeamsRepository {
    export type Interface = ITeamsRepository;
    export type Error = RepositoryError;
}

export type CodeTeam = {
    name: string;
    slug: string;
    description: string;
    roles: string[];
    system?: boolean;
};

export interface ITeamFactory {
    execute(): Promise<CodeTeam[]>;
}

export const TeamFactory = createAbstraction<ITeamFactory>("TeamFactory");

export namespace TeamFactory {
    export type Interface = ITeamFactory;
    export type Return = Promise<CodeTeam[]>;
    export type Team = CodeTeam;
}

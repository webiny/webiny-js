import { createAbstraction } from "@webiny/feature/admin";
import type { IListCache } from "~/features/listCache/index.js";
import type { Team } from "../../types.js";

export const TeamsListCache = createAbstraction<IListCache<Team>>(
    "AccessManagement/TeamsListCache"
);

export namespace TeamsListCache {
    export type Interface = IListCache<Team>;
}

export interface IListTeamsGatewayResult {
    data: Team[];
}

export interface IListTeamsGateway {
    execute(): Promise<IListTeamsGatewayResult>;
}

export const ListTeamsGateway = createAbstraction<IListTeamsGateway>(
    "AccessManagement/ListTeamsGateway"
);

export namespace ListTeamsGateway {
    export type Interface = IListTeamsGateway;
}

export interface IListTeamsRepository {
    execute(): Promise<IListTeamsGatewayResult>;
}

export const ListTeamsRepository = createAbstraction<IListTeamsRepository>(
    "AccessManagement/ListTeamsRepository"
);

export namespace ListTeamsRepository {
    export type Interface = IListTeamsRepository;
}

export interface IListTeamsUseCase {
    execute(): Promise<IListTeamsGatewayResult>;
}

export const ListTeamsUseCase = createAbstraction<IListTeamsUseCase>(
    "AccessManagement/ListTeamsUseCase"
);

export namespace ListTeamsUseCase {
    export type Interface = IListTeamsUseCase;
}

import { createAbstraction } from "@webiny/feature/admin";
import type { Team } from "../../types.js";

export interface IGetTeamGateway {
    execute(id: string): Promise<Team>;
}

export const GetTeamGateway = createAbstraction<IGetTeamGateway>("AccessManagement/GetTeamGateway");

export namespace GetTeamGateway {
    export type Interface = IGetTeamGateway;
}

export interface IGetTeamRepository {
    execute(id: string): Promise<Team>;
}

export const GetTeamRepository = createAbstraction<IGetTeamRepository>(
    "AccessManagement/GetTeamRepository"
);

export namespace GetTeamRepository {
    export type Interface = IGetTeamRepository;
}

export interface IGetTeamUseCase {
    execute(id: string): Promise<Team>;
}

export const GetTeamUseCase = createAbstraction<IGetTeamUseCase>("AccessManagement/GetTeamUseCase");

export namespace GetTeamUseCase {
    export type Interface = IGetTeamUseCase;
}

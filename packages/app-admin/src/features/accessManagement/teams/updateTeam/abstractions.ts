import { createAbstraction } from "@webiny/feature/admin";
import type { Team } from "../../types.js";

export interface IUpdateTeamData {
    name: string;
    description?: string;
    roles: string[];
}

export interface IUpdateTeamGateway {
    execute(id: string, data: IUpdateTeamData): Promise<Team>;
}

export const UpdateTeamGateway = createAbstraction<IUpdateTeamGateway>(
    "AccessManagement/UpdateTeamGateway"
);

export namespace UpdateTeamGateway {
    export type Interface = IUpdateTeamGateway;
}

export interface IUpdateTeamRepository {
    execute(id: string, data: IUpdateTeamData): Promise<Team>;
}

export const UpdateTeamRepository = createAbstraction<IUpdateTeamRepository>(
    "AccessManagement/UpdateTeamRepository"
);

export namespace UpdateTeamRepository {
    export type Interface = IUpdateTeamRepository;
}

export interface IUpdateTeamUseCase {
    execute(id: string, data: IUpdateTeamData): Promise<Team>;
}

export const UpdateTeamUseCase = createAbstraction<IUpdateTeamUseCase>(
    "AccessManagement/UpdateTeamUseCase"
);

export namespace UpdateTeamUseCase {
    export type Interface = IUpdateTeamUseCase;
}

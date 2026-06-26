import { createAbstraction } from "@webiny/feature/admin";
import type { Team } from "../../types.js";

export interface ICreateTeamData {
    name: string;
    slug: string;
    description?: string;
    roles: string[];
}

export interface ICreateTeamGateway {
    execute(data: ICreateTeamData): Promise<Team>;
}

export const CreateTeamGateway = createAbstraction<ICreateTeamGateway>(
    "AccessManagement/CreateTeamGateway"
);

export namespace CreateTeamGateway {
    export type Interface = ICreateTeamGateway;
}

export interface ICreateTeamRepository {
    execute(data: ICreateTeamData): Promise<Team>;
}

export const CreateTeamRepository = createAbstraction<ICreateTeamRepository>(
    "AccessManagement/CreateTeamRepository"
);

export namespace CreateTeamRepository {
    export type Interface = ICreateTeamRepository;
}

export interface ICreateTeamUseCase {
    execute(data: ICreateTeamData): Promise<Team>;
}

export const CreateTeamUseCase = createAbstraction<ICreateTeamUseCase>(
    "AccessManagement/CreateTeamUseCase"
);

export namespace CreateTeamUseCase {
    export type Interface = ICreateTeamUseCase;
}

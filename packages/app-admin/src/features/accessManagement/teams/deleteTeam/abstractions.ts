import { createAbstraction } from "@webiny/feature/admin";

export interface IDeleteTeamGateway {
    execute(id: string): Promise<void>;
}

export const DeleteTeamGateway = createAbstraction<IDeleteTeamGateway>(
    "AccessManagement/DeleteTeamGateway"
);

export namespace DeleteTeamGateway {
    export type Interface = IDeleteTeamGateway;
}

export interface IDeleteTeamRepository {
    execute(id: string): Promise<void>;
}

export const DeleteTeamRepository = createAbstraction<IDeleteTeamRepository>(
    "AccessManagement/DeleteTeamRepository"
);

export namespace DeleteTeamRepository {
    export type Interface = IDeleteTeamRepository;
}

export interface IDeleteTeamUseCase {
    execute(id: string): Promise<void>;
}

export const DeleteTeamUseCase = createAbstraction<IDeleteTeamUseCase>(
    "AccessManagement/DeleteTeamUseCase"
);

export namespace DeleteTeamUseCase {
    export type Interface = IDeleteTeamUseCase;
}

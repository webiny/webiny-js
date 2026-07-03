import { createAbstraction } from "@webiny/feature/admin";

export interface IDeleteRoleGateway {
    execute(id: string): Promise<void>;
}

export const DeleteRoleGateway = createAbstraction<IDeleteRoleGateway>(
    "AccessManagement/DeleteRoleGateway"
);

export namespace DeleteRoleGateway {
    export type Interface = IDeleteRoleGateway;
}

export interface IDeleteRoleRepository {
    execute(id: string): Promise<void>;
}

export const DeleteRoleRepository = createAbstraction<IDeleteRoleRepository>(
    "AccessManagement/DeleteRoleRepository"
);

export namespace DeleteRoleRepository {
    export type Interface = IDeleteRoleRepository;
}

export interface IDeleteRoleUseCase {
    execute(id: string): Promise<void>;
}

export const DeleteRoleUseCase = createAbstraction<IDeleteRoleUseCase>(
    "AccessManagement/DeleteRoleUseCase"
);

export namespace DeleteRoleUseCase {
    export type Interface = IDeleteRoleUseCase;
}

import { createAbstraction } from "@webiny/feature/admin";
import type { Identity } from "~/domain/Identity.js";
import type { Role } from "../../types.js";

export interface IUpdateRoleData {
    name: string;
    description?: string;
    permissions: Identity.Permission[];
}

export interface IUpdateRoleGateway {
    execute(id: string, data: IUpdateRoleData): Promise<Role>;
}

export const UpdateRoleGateway = createAbstraction<IUpdateRoleGateway>(
    "AccessManagement/UpdateRoleGateway"
);

export namespace UpdateRoleGateway {
    export type Interface = IUpdateRoleGateway;
}

export interface IUpdateRoleRepository {
    execute(id: string, data: IUpdateRoleData): Promise<Role>;
}

export const UpdateRoleRepository = createAbstraction<IUpdateRoleRepository>(
    "AccessManagement/UpdateRoleRepository"
);

export namespace UpdateRoleRepository {
    export type Interface = IUpdateRoleRepository;
}

export interface IUpdateRoleUseCase {
    execute(id: string, data: IUpdateRoleData): Promise<Role>;
}

export const UpdateRoleUseCase = createAbstraction<IUpdateRoleUseCase>(
    "AccessManagement/UpdateRoleUseCase"
);

export namespace UpdateRoleUseCase {
    export type Interface = IUpdateRoleUseCase;
}

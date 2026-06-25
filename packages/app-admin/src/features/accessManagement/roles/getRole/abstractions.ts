import { createAbstraction } from "@webiny/feature/admin";
import type { Role } from "../../types.js";

export interface IGetRoleGateway {
    execute(id: string): Promise<Role>;
}

export const GetRoleGateway = createAbstraction<IGetRoleGateway>("AccessManagement/GetRoleGateway");

export namespace GetRoleGateway {
    export type Interface = IGetRoleGateway;
}

export interface IGetRoleRepository {
    execute(id: string): Promise<Role>;
}

export const GetRoleRepository = createAbstraction<IGetRoleRepository>(
    "AccessManagement/GetRoleRepository"
);

export namespace GetRoleRepository {
    export type Interface = IGetRoleRepository;
}

export interface IGetRoleUseCase {
    execute(id: string): Promise<Role>;
}

export const GetRoleUseCase = createAbstraction<IGetRoleUseCase>("AccessManagement/GetRoleUseCase");

export namespace GetRoleUseCase {
    export type Interface = IGetRoleUseCase;
}

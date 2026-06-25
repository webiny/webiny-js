import { createAbstraction } from "@webiny/feature/admin";
import type { Identity } from "~/domain/Identity.js";
import type { Role } from "../../types.js";

export interface ICreateRoleData {
    name: string;
    slug: string;
    description?: string;
    permissions: Identity.Permission[];
}

export interface ICreateRoleGateway {
    execute(data: ICreateRoleData): Promise<Role>;
}

export const CreateRoleGateway = createAbstraction<ICreateRoleGateway>(
    "AccessManagement/CreateRoleGateway"
);

export namespace CreateRoleGateway {
    export type Interface = ICreateRoleGateway;
}

export interface ICreateRoleRepository {
    execute(data: ICreateRoleData): Promise<Role>;
}

export const CreateRoleRepository = createAbstraction<ICreateRoleRepository>(
    "AccessManagement/CreateRoleRepository"
);

export namespace CreateRoleRepository {
    export type Interface = ICreateRoleRepository;
}

export interface ICreateRoleUseCase {
    execute(data: ICreateRoleData): Promise<Role>;
}

export const CreateRoleUseCase = createAbstraction<ICreateRoleUseCase>(
    "AccessManagement/CreateRoleUseCase"
);

export namespace CreateRoleUseCase {
    export type Interface = ICreateRoleUseCase;
}

import { createAbstraction } from "@webiny/feature/admin";
import type { IListCache } from "~/features/listCache/index.js";
import type { Role } from "../../types.js";

export const RolesListCache = createAbstraction<IListCache<Role>>(
    "AccessManagement/RolesListCache"
);

export namespace RolesListCache {
    export type Interface = IListCache<Role>;
}

export interface IListRolesGatewayResult {
    data: Role[];
}

export interface IListRolesGateway {
    execute(): Promise<IListRolesGatewayResult>;
}

export const ListRolesGateway = createAbstraction<IListRolesGateway>(
    "AccessManagement/ListRolesGateway"
);

export namespace ListRolesGateway {
    export type Interface = IListRolesGateway;
}

export interface IListRolesRepository {
    execute(): Promise<IListRolesGatewayResult>;
}

export const ListRolesRepository = createAbstraction<IListRolesRepository>(
    "AccessManagement/ListRolesRepository"
);

export namespace ListRolesRepository {
    export type Interface = IListRolesRepository;
}

export interface IListRolesUseCase {
    execute(): Promise<IListRolesGatewayResult>;
}

export const ListRolesUseCase = createAbstraction<IListRolesUseCase>(
    "AccessManagement/ListRolesUseCase"
);

export namespace ListRolesUseCase {
    export type Interface = IListRolesUseCase;
}

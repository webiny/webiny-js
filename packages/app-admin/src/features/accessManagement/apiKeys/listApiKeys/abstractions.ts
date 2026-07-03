import { createAbstraction } from "@webiny/feature/admin";
import type { IListCache } from "~/features/listCache/index.js";
import type { ApiKey } from "../../types.js";

export const ApiKeysListCache = createAbstraction<IListCache<ApiKey>>(
    "AccessManagement/ApiKeysListCache"
);

export namespace ApiKeysListCache {
    export type Interface = IListCache<ApiKey>;
}

export interface IListApiKeysGatewayResult {
    data: ApiKey[];
}

export interface IListApiKeysGateway {
    execute(): Promise<IListApiKeysGatewayResult>;
}

export const ListApiKeysGateway = createAbstraction<IListApiKeysGateway>(
    "AccessManagement/ListApiKeysGateway"
);

export namespace ListApiKeysGateway {
    export type Interface = IListApiKeysGateway;
}

export interface IListApiKeysRepository {
    execute(): Promise<IListApiKeysGatewayResult>;
}

export const ListApiKeysRepository = createAbstraction<IListApiKeysRepository>(
    "AccessManagement/ListApiKeysRepository"
);

export namespace ListApiKeysRepository {
    export type Interface = IListApiKeysRepository;
}

export interface IListApiKeysUseCase {
    execute(): Promise<IListApiKeysGatewayResult>;
}

export const ListApiKeysUseCase = createAbstraction<IListApiKeysUseCase>(
    "AccessManagement/ListApiKeysUseCase"
);

export namespace ListApiKeysUseCase {
    export type Interface = IListApiKeysUseCase;
}

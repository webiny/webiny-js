import { createAbstraction } from "@webiny/feature/admin";
import type { ApiKey } from "../../types.js";

export interface IGetApiKeyGateway {
    execute(id: string): Promise<ApiKey>;
}

export const GetApiKeyGateway = createAbstraction<IGetApiKeyGateway>(
    "AccessManagement/GetApiKeyGateway"
);

export namespace GetApiKeyGateway {
    export type Interface = IGetApiKeyGateway;
}

export interface IGetApiKeyRepository {
    execute(id: string): Promise<ApiKey>;
}

export const GetApiKeyRepository = createAbstraction<IGetApiKeyRepository>(
    "AccessManagement/GetApiKeyRepository"
);

export namespace GetApiKeyRepository {
    export type Interface = IGetApiKeyRepository;
}

export interface IGetApiKeyUseCase {
    execute(id: string): Promise<ApiKey>;
}

export const GetApiKeyUseCase = createAbstraction<IGetApiKeyUseCase>(
    "AccessManagement/GetApiKeyUseCase"
);

export namespace GetApiKeyUseCase {
    export type Interface = IGetApiKeyUseCase;
}

import { createAbstraction } from "@webiny/feature/admin";
import type { Identity } from "~/domain/Identity.js";
import type { ApiKey } from "../../types.js";

export interface IUpdateApiKeyData {
    name: string;
    description: string;
    permissions: Identity.Permission[];
}

export interface IUpdateApiKeyGateway {
    execute(id: string, data: IUpdateApiKeyData): Promise<ApiKey>;
}

export const UpdateApiKeyGateway = createAbstraction<IUpdateApiKeyGateway>(
    "AccessManagement/UpdateApiKeyGateway"
);

export namespace UpdateApiKeyGateway {
    export type Interface = IUpdateApiKeyGateway;
}

export interface IUpdateApiKeyRepository {
    execute(id: string, data: IUpdateApiKeyData): Promise<ApiKey>;
}

export const UpdateApiKeyRepository = createAbstraction<IUpdateApiKeyRepository>(
    "AccessManagement/UpdateApiKeyRepository"
);

export namespace UpdateApiKeyRepository {
    export type Interface = IUpdateApiKeyRepository;
}

export interface IUpdateApiKeyUseCase {
    execute(id: string, data: IUpdateApiKeyData): Promise<ApiKey>;
}

export const UpdateApiKeyUseCase = createAbstraction<IUpdateApiKeyUseCase>(
    "AccessManagement/UpdateApiKeyUseCase"
);

export namespace UpdateApiKeyUseCase {
    export type Interface = IUpdateApiKeyUseCase;
}

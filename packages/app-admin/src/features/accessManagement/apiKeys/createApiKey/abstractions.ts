import { createAbstraction } from "@webiny/feature/admin";
import type { Identity } from "~/domain/Identity.js";
import type { ApiKey } from "../../types.js";

export interface ICreateApiKeyData {
    name: string;
    slug: string;
    description: string;
    permissions: Identity.Permission[];
}

export interface ICreateApiKeyGateway {
    execute(data: ICreateApiKeyData): Promise<ApiKey>;
}

export const CreateApiKeyGateway = createAbstraction<ICreateApiKeyGateway>(
    "AccessManagement/CreateApiKeyGateway"
);

export namespace CreateApiKeyGateway {
    export type Interface = ICreateApiKeyGateway;
}

export interface ICreateApiKeyRepository {
    execute(data: ICreateApiKeyData): Promise<ApiKey>;
}

export const CreateApiKeyRepository = createAbstraction<ICreateApiKeyRepository>(
    "AccessManagement/CreateApiKeyRepository"
);

export namespace CreateApiKeyRepository {
    export type Interface = ICreateApiKeyRepository;
}

export interface ICreateApiKeyUseCase {
    execute(data: ICreateApiKeyData): Promise<ApiKey>;
}

export const CreateApiKeyUseCase = createAbstraction<ICreateApiKeyUseCase>(
    "AccessManagement/CreateApiKeyUseCase"
);

export namespace CreateApiKeyUseCase {
    export type Interface = ICreateApiKeyUseCase;
}

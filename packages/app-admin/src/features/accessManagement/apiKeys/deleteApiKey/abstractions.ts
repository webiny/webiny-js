import { createAbstraction } from "@webiny/feature/admin";

export interface IDeleteApiKeyGateway {
    execute(id: string): Promise<void>;
}

export const DeleteApiKeyGateway = createAbstraction<IDeleteApiKeyGateway>(
    "AccessManagement/DeleteApiKeyGateway"
);

export namespace DeleteApiKeyGateway {
    export type Interface = IDeleteApiKeyGateway;
}

export interface IDeleteApiKeyRepository {
    execute(id: string): Promise<void>;
}

export const DeleteApiKeyRepository = createAbstraction<IDeleteApiKeyRepository>(
    "AccessManagement/DeleteApiKeyRepository"
);

export namespace DeleteApiKeyRepository {
    export type Interface = IDeleteApiKeyRepository;
}

export interface IDeleteApiKeyUseCase {
    execute(id: string): Promise<void>;
}

export const DeleteApiKeyUseCase = createAbstraction<IDeleteApiKeyUseCase>(
    "AccessManagement/DeleteApiKeyUseCase"
);

export namespace DeleteApiKeyUseCase {
    export type Interface = IDeleteApiKeyUseCase;
}

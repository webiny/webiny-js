import { createAbstraction } from "@webiny/feature/admin";

export interface DeleteRedirectParams {
    id: string;
}

export interface IDeleteRedirectGateway {
    execute(params: DeleteRedirectParams): Promise<void>;
}

export const DeleteRedirectGateway = createAbstraction<IDeleteRedirectGateway>(
    "WebsiteBuilder/DeleteRedirectGateway"
);

export namespace DeleteRedirectGateway {
    export type Interface = IDeleteRedirectGateway;
}

export interface IDeleteRedirectRepository {
    execute(params: DeleteRedirectParams): Promise<void>;
}

export const DeleteRedirectRepository = createAbstraction<IDeleteRedirectRepository>(
    "WebsiteBuilder/DeleteRedirectRepository"
);

export namespace DeleteRedirectRepository {
    export type Interface = IDeleteRedirectRepository;
}

export interface IDeleteRedirectUseCase {
    execute(params: DeleteRedirectParams): Promise<void>;
}

export const DeleteRedirectUseCase = createAbstraction<IDeleteRedirectUseCase>(
    "WebsiteBuilder/DeleteRedirectUseCase"
);

export namespace DeleteRedirectUseCase {
    export type Interface = IDeleteRedirectUseCase;
}

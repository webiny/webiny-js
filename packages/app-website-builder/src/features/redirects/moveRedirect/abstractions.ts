import { createAbstraction } from "@webiny/feature/admin";

export interface MoveRedirectParams {
    id: string;
    folderId: string;
}

export interface IMoveRedirectGateway {
    execute(params: MoveRedirectParams): Promise<void>;
}

export const MoveRedirectGateway = createAbstraction<IMoveRedirectGateway>(
    "WebsiteBuilder/MoveRedirectGateway"
);

export namespace MoveRedirectGateway {
    export type Interface = IMoveRedirectGateway;
}

export interface IMoveRedirectUseCase {
    execute(params: MoveRedirectParams): Promise<void>;
}

export const MoveRedirectUseCase = createAbstraction<IMoveRedirectUseCase>(
    "WebsiteBuilder/MoveRedirectUseCase"
);

export namespace MoveRedirectUseCase {
    export type Interface = IMoveRedirectUseCase;
}

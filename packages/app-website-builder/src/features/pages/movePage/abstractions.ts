import { createAbstraction } from "@webiny/feature/admin";

//
// Params
//
export interface MovePageParams {
    id: string;
    folderId: string;
}

//
// UseCase
//
export interface IMovePageUseCase {
    execute(params: MovePageParams): Promise<void>;
}

export const MovePageUseCase = createAbstraction<IMovePageUseCase>(
    "WebsiteBuilder/MovePageUseCase"
);

export namespace MovePageUseCase {
    export type Interface = IMovePageUseCase;
    export type Params = MovePageParams;
}

//
// Repository
//
export interface IMovePageRepository {
    execute(id: string, folderId: string): Promise<void>;
}

export const MovePageRepository = createAbstraction<IMovePageRepository>(
    "WebsiteBuilder/MovePageRepository"
);

export namespace MovePageRepository {
    export type Interface = IMovePageRepository;
}

//
// Gateway
//
export interface IMovePageGateway {
    execute(id: string, folderId: string): Promise<void>;
}

export const MovePageGateway = createAbstraction<IMovePageGateway>(
    "WebsiteBuilder/MovePageGateway"
);

export namespace MovePageGateway {
    export type Interface = IMovePageGateway;
}

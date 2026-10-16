import { createAbstraction } from "@webiny/feature/admin";
import type { Page } from "~/domain/Page/Page.js";

//
// Params
//
export interface DeletePageRevisionParams {
    id: string;
    permanently: boolean;
}

//
// UseCase
//
export interface IDeletePageRevisionUseCase {
    /**
     * Resolves false when the delete was not carried out (a decorator's warning was dismissed).
     */
    execute(params: DeletePageRevisionParams): Promise<boolean>;
}

export const DeletePageRevisionUseCase = createAbstraction<IDeletePageRevisionUseCase>(
    "WebsiteBuilder/DeletePageRevisionUseCase"
);

export namespace DeletePageRevisionUseCase {
    export type Interface = IDeletePageRevisionUseCase;
    export type Params = DeletePageRevisionParams;
}

//
// Repository
//
export interface IDeletePageRevisionRepository {
    execute(page: Page, permanently: boolean): Promise<void>;
}

export const DeletePageRevisionRepository = createAbstraction<IDeletePageRevisionRepository>(
    "WebsiteBuilder/DeletePageRevisionRepository"
);

export namespace DeletePageRevisionRepository {
    export type Interface = IDeletePageRevisionRepository;
}

//
// Gateway
//
export interface IDeletePageRevisionGateway {
    execute(id: string, permanently: boolean): Promise<void>;
}

export const DeletePageRevisionGateway = createAbstraction<IDeletePageRevisionGateway>(
    "WebsiteBuilder/DeletePageRevisionGateway"
);

export namespace DeletePageRevisionGateway {
    export type Interface = IDeletePageRevisionGateway;
}

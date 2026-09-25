import { createAbstraction } from "@webiny/feature/admin";
import type { Page } from "~/domain/Page/Page.js";

//
// Params
//
export interface DeletePageRevisionParams {
    id: string;
}

//
// UseCase
//
export interface IDeletePageRevisionUseCase {
    execute(params: DeletePageRevisionParams): Promise<void>;
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
    execute(page: Page): Promise<void>;
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
    execute(id: string): Promise<void>;
}

export const DeletePageRevisionGateway = createAbstraction<IDeletePageRevisionGateway>(
    "WebsiteBuilder/DeletePageRevisionGateway"
);

export namespace DeletePageRevisionGateway {
    export type Interface = IDeletePageRevisionGateway;
}

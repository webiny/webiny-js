import { createAbstraction } from "@webiny/feature/admin";
import type { Page } from "~/domain/Page/Page.js";

//
// Params
//
export interface DeletePageParams {
    id: string;
    permanently: boolean;
}

//
// UseCase
//
export interface IDeletePageUseCase {
    execute(params: DeletePageParams): Promise<void>;
}

export const DeletePageUseCase = createAbstraction<IDeletePageUseCase>(
    "WebsiteBuilder/DeletePageUseCase"
);

export namespace DeletePageUseCase {
    export type Interface = IDeletePageUseCase;
    export type Params = DeletePageParams;
}

//
// Repository
//
export interface IDeletePageRepository {
    execute(page: Page, permanently: boolean): Promise<void>;
}

export const DeletePageRepository = createAbstraction<IDeletePageRepository>(
    "WebsiteBuilder/DeletePageRepository"
);

export namespace DeletePageRepository {
    export type Interface = IDeletePageRepository;
}

//
// Gateway
//
export interface IDeletePageGateway {
    execute(id: string, permanently: boolean): Promise<void>;
}

export const DeletePageGateway = createAbstraction<IDeletePageGateway>(
    "WebsiteBuilder/DeletePageGateway"
);

export namespace DeletePageGateway {
    export type Interface = IDeletePageGateway;
}

import { createAbstraction } from "@webiny/feature/admin";
import type { Page } from "~/domain/Page/Page.js";
import type { PageGatewayDto } from "./PageGatewayDto.js";

// Extension point for field selection
export interface IGetPageGraphQLFieldSelection {
    getSelection(): string[];
}

export const GetPageGraphQLFieldSelection = createAbstraction<IGetPageGraphQLFieldSelection>(
    "GetPageGraphQLFieldSelection"
);

export namespace GetPageGraphQLFieldSelection {
    export type Interface = IGetPageGraphQLFieldSelection;
}

// Params
export interface GetPageParams {
    id: string;
}

// UseCase
export interface IGetPageUseCase {
    execute(params: GetPageParams): Promise<Page>;
}

export const GetPageUseCase = createAbstraction<IGetPageUseCase>("WebsiteBuilder/GetPageUseCase");
export namespace GetPageUseCase {
    export type Interface = IGetPageUseCase;
    export type Params = GetPageParams;
}

// Repository
export interface IGetPageRepository {
    execute(id: string): Promise<Page>;
}

export const GetPageRepository = createAbstraction<IGetPageRepository>(
    "WebsiteBuilder/GetPageRepository"
);
export namespace GetPageRepository {
    export type Interface = IGetPageRepository;
}

// Gateway
export interface IGetPageGateway {
    execute(id: string): Promise<PageGatewayDto>;
}

export const GetPageGateway = createAbstraction<IGetPageGateway>("WebsiteBuilder/GetPageGateway");
export namespace GetPageGateway {
    export type Interface = IGetPageGateway;
}

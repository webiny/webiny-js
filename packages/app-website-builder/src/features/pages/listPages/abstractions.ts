import { createAbstraction } from "@webiny/feature/admin";
import type { Page } from "~/domain/Page/Page.js";
import type { WbListMeta } from "~/types.js";

// Extension point for field selection
export interface IListPagesGraphQLFieldSelection {
    getSelection(): string[];
}

export const ListPagesGraphQLFieldSelection = createAbstraction<IListPagesGraphQLFieldSelection>(
    "ListPagesGraphQLFieldSelection"
);

export namespace ListPagesGraphQLFieldSelection {
    export type Interface = IListPagesGraphQLFieldSelection;
}

// Gateway

export interface IListPagesGatewayParams {
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListPagesGatewayResult {
    data: Page[];
    meta: WbListMeta;
}

export interface IListPagesGateway {
    execute(params: IListPagesGatewayParams): Promise<IListPagesGatewayResult>;
}

export const ListPagesGateway = createAbstraction<IListPagesGateway>(
    "WebsiteBuilder/ListPagesGateway"
);

export namespace ListPagesGateway {
    export type Interface = IListPagesGateway;
}

// Repository

export interface IListPagesRepositoryParams {
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListPagesRepositoryResult {
    data: Page[];
    meta: WbListMeta;
}

export interface IListPagesRepository {
    execute(params: IListPagesRepositoryParams): Promise<IListPagesRepositoryResult>;
}

export const ListPagesRepository = createAbstraction<IListPagesRepository>(
    "WebsiteBuilder/ListPagesRepository"
);

export namespace ListPagesRepository {
    export type Interface = IListPagesRepository;
}

// UseCase

export interface IListPagesUseCaseParams {
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListPagesUseCaseResult {
    data: Page[];
    meta: WbListMeta;
}

export interface IListPagesUseCase {
    execute(params: IListPagesUseCaseParams): Promise<IListPagesUseCaseResult>;
}

export const ListPagesUseCase = createAbstraction<IListPagesUseCase>(
    "WebsiteBuilder/ListPagesUseCase"
);

export namespace ListPagesUseCase {
    export type Interface = IListPagesUseCase;
}

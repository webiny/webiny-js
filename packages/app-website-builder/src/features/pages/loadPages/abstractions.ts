import { createAbstraction } from "@webiny/feature/admin";
import type { Sorting, SortingDTO } from "@webiny/app-utils";
import type { PageGatewayDto } from "./PageGatewayDto.js";
import type { WbListMeta } from "~/types.js";

// Extension point for field selection (KEEP EXISTING)
export interface IListPagesGraphQLFieldSelection {
    getSelection(): string[];
}

export const ListPagesGraphQLFieldSelection = createAbstraction<IListPagesGraphQLFieldSelection>(
    "ListPagesGraphQLFieldSelection"
);

export namespace ListPagesGraphQLFieldSelection {
    export type Interface = IListPagesGraphQLFieldSelection;
}

// LoadPages UseCase
export interface LoadPagesUseCaseParams {
    folderId: string;
    resetSearch?: boolean;
}

export interface ILoadPagesUseCase {
    execute(params: LoadPagesUseCaseParams): Promise<void>;
}

export const LoadPagesUseCase = createAbstraction<ILoadPagesUseCase>(
    "WebsiteBuilder/LoadPagesUseCase"
);
export namespace LoadPagesUseCase {
    export type Interface = ILoadPagesUseCase;
    export type Params = LoadPagesUseCaseParams;
}

// FilterPages UseCase
export interface FilterPagesUseCaseParams {
    filters: Record<string, any>;
    folderIds: string[];
}

export interface IFilterPagesUseCase {
    execute(params: FilterPagesUseCaseParams): Promise<void>;
}

export const FilterPagesUseCase = createAbstraction<IFilterPagesUseCase>(
    "WebsiteBuilder/FilterPagesUseCase"
);
export namespace FilterPagesUseCase {
    export type Interface = IFilterPagesUseCase;
    export type Params = FilterPagesUseCaseParams;
}

// SearchPages UseCase
export interface SearchPagesUseCaseParams {
    query: string;
    folderIds: string[];
}

export interface ISearchPagesUseCase {
    execute(params: SearchPagesUseCaseParams): Promise<void>;
}

export const SearchPagesUseCase = createAbstraction<ISearchPagesUseCase>(
    "WebsiteBuilder/SearchPagesUseCase"
);
export namespace SearchPagesUseCase {
    export type Interface = ISearchPagesUseCase;
    export type Params = SearchPagesUseCaseParams;
}

// SortPages UseCase
export interface SortPagesUseCaseParams {
    sorts: SortingDTO[];
}

export interface ISortPagesUseCase {
    execute(params: SortPagesUseCaseParams): Promise<void>;
}

export const SortPagesUseCase = createAbstraction<ISortPagesUseCase>(
    "WebsiteBuilder/SortPagesUseCase"
);
export namespace SortPagesUseCase {
    export type Interface = ISortPagesUseCase;
    export type Params = SortPagesUseCaseParams;
}

// LoadMorePages UseCase
export interface ILoadMorePagesUseCase {
    execute(): Promise<void>;
}

export const LoadMorePagesUseCase = createAbstraction<ILoadMorePagesUseCase>(
    "WebsiteBuilder/LoadMorePagesUseCase"
);
export namespace LoadMorePagesUseCase {
    export type Interface = ILoadMorePagesUseCase;
}

// ListPages Repository
export interface LoadPagesRepositoryParams {
    where?: Record<string, any>;
    resetSearch?: boolean;
}

export interface IListPagesRepository {
    loadPages(params: LoadPagesRepositoryParams): Promise<void>;
    loadMorePages(): Promise<void>;
    searchPages(query: string, where: Record<string, any>): Promise<void>;
    sortPages(sorts: Sorting[]): Promise<void>;
    filterPages(filters: Record<string, any>, where: Record<string, any>): Promise<void>;
}

export const ListPagesRepository = createAbstraction<IListPagesRepository>(
    "WebsiteBuilder/ListPagesRepository"
);
export namespace ListPagesRepository {
    export type Interface = IListPagesRepository;
}

// ListPages Gateway
export interface ListPagesGatewayParams {
    where: Record<string, any>;
    limit: number;
    sort?: string[];
    after?: string;
    search?: string;
}

export interface ListPagesGatewayResponse {
    pages: PageGatewayDto[];
    meta: WbListMeta;
}

export interface IListPagesGateway {
    execute(params: ListPagesGatewayParams): Promise<ListPagesGatewayResponse>;
}

export const ListPagesGateway = createAbstraction<IListPagesGateway>(
    "WebsiteBuilder/ListPagesGateway"
);
export namespace ListPagesGateway {
    export type Interface = IListPagesGateway;
}

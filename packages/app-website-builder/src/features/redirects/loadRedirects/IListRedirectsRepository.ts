import { Sorting } from "@webiny/app-utils";

export interface LoadRedirectsRepositoryParams {
    where?: Record<string, any>;
    resetSearch?: boolean;
}

export interface IListRedirectsRepository {
    loadRedirects: (params: LoadRedirectsRepositoryParams) => Promise<void>;
    loadMoreRedirects: () => Promise<void>;
    searchRedirects: (query: string, where: Record<string, any>) => Promise<void>;
    sortRedirects: (sorts: Sorting[]) => Promise<void>;
    filterRedirects: (filters: Record<string, any>, where: Record<string, any>) => Promise<void>;
}

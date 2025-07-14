import { Sorting } from "@webiny/app-utils";

export interface LoadPagesRepositoryParams {
    where?: Record<string, any>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListPagesRepository {
    loadPages: (params: LoadPagesRepositoryParams) => Promise<void>;
    loadMorePages: () => Promise<void>;
    searchPages: (query: string, where: Record<string, any>) => Promise<void>;
    sortPages: (sorts: Sorting[]) => Promise<void>;
    filterPages: (filters: Record<string, any>, where: Record<string, any>) => Promise<void>;
}

export interface IListPagesRepositoryParams {
    where?: {
        [key: string]: any;
    };
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListPagesRepository {
    execute: (params?: IListPagesRepositoryParams) => Promise<void>;
}

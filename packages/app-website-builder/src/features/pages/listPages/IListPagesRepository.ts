export interface IListPagesRepositoryParams {
    folderId: string;
}

export interface IListPagesRepository {
    execute: (params: IListPagesRepositoryParams) => Promise<void>;
}

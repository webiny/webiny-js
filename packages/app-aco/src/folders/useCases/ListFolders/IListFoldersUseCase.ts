export interface ListFoldersParams {
    type: string;
}

export interface IListFoldersUseCase {
    execute: (params: ListFoldersParams) => Promise<void>;
}

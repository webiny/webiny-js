export interface DeleteFolderParams {
    id: string;
}

export interface IDeleteFolderUseCase {
    execute: (params: DeleteFolderParams) => Promise<void>;
}

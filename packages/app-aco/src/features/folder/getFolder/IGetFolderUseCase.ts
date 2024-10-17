export interface GetFolderParams {
    id: string;
}

export interface IGetFolderUseCase {
    execute: (params: GetFolderParams) => Promise<void>;
}

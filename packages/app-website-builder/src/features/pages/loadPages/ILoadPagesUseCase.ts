export interface LoadPagesUseCaseParams {
    folderId: string;
}

export interface ILoadPagesUseCase {
    execute: (params: LoadPagesUseCaseParams) => Promise<void>;
}

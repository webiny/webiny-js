export interface LoadRedirectsUseCaseParams {
    folderId: string;
    resetSearch?: boolean;
}

export interface ILoadRedirectsUseCase {
    execute: (params: LoadRedirectsUseCaseParams) => Promise<void>;
}

export interface SearchRedirectsUseCaseParams {
    query: string;
    folderIds: string[];
}

export interface ISearchRedirectsUseCase {
    execute: (params: SearchRedirectsUseCaseParams) => Promise<void>;
}

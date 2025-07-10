export interface SearchPagesUseCaseParams {
    query: string;
    folderIds: string[];
}

export interface ISearchPagesUseCase {
    execute: (params: SearchPagesUseCaseParams) => Promise<void>;
}

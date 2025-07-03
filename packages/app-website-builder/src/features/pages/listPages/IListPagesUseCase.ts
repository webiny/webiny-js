export interface ListPagesUseCaseParams {
    folderId: string;
}

export interface IListPagesUseCase {
    execute: (params: ListPagesUseCaseParams) => Promise<void>;
}

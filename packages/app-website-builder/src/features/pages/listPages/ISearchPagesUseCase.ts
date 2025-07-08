export interface ISearchPagesUseCase {
    execute: (query: string, folderIds: string[]) => Promise<void>;
}

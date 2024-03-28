export interface ISearchItemsUseCase {
    execute: (query: string) => Promise<void>;
}

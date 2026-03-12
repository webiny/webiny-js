export interface ISearchItemsUseCase {
    execute: (value: string) => Promise<void>;
}

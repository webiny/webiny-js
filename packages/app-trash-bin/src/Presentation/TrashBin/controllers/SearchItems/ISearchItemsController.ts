export interface ISearchItemsController {
    execute: (query: string) => Promise<void>;
}

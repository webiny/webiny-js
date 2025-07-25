export interface ISearchItemsController {
    execute: (value: string) => Promise<void>;
}

export interface ISearchController {
    execute: (query: string) => Promise<void>;
}

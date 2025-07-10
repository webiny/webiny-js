export interface ISearchRepository {
    get: () => string;
    set: (query: string) => Promise<void>;
}
